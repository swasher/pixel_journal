
import Papa from 'papaparse';
import { db, user } from '$lib/firebase';
import { get } from 'svelte/store';
import { allGames } from '$lib/stores/allGames';
import { userSettings } from '$lib/stores/userSettings';
import { writeBatch, doc, collection, updateDoc, arrayUnion } from 'firebase/firestore';
import type { User } from 'firebase/auth';

// These functions are moved from Header.svelte

function getSlugFromUrl(url: string): string | null {
    try {
        const path = new URL(url).pathname;
        const parts = path.split('/').filter(p => p);
        if (parts.length > 0 && parts[0] === 'games') {
            return parts[1];
        }
        return null;
    } catch (e) {
        return null;
    }
}

function getRatingMapping(rating: string): { stars: number, isFavorite: boolean } {
    switch (rating?.toLowerCase()) {
        case 'exceptional': return { stars: 5, isFavorite: true };
        case 'recommended': return { stars: 4, isFavorite: false };
        case 'meh': return { stars: 3, isFavorite: false };
        case 'skip': return { stars: 1, isFavorite: false };
        default: return { stars: 0, isFavorite: false };
    }
}

export interface ImportCallbacks {
    onMessage: (message: string) => void;
    onProgress: (progress: { current: number, total: number }) => void;
    onComplete: (summary: { added: number, skipped: number }) => void;
    onError: (message: string) => void;
}

export async function importGamesFromCsv(file: File, currentUser: User, callbacks: ImportCallbacks) {
    const fileContent = await file.text();

    Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const gamesFromCsv = results.data as any[];
            const totalGames = gamesFromCsv.length;
            callbacks.onProgress({ current: 0, total: totalGames });

            const batch = writeBatch(db);
            const newCategories = new Set<string>();
            const newTags = new Set<string>();
            let addedCount = 0;
            let skippedCount = 0;

            const currentAllGames = get(allGames);
            const currentUserSettings = get(userSettings);
            
            console.log(`---------- STARTING CSV IMPORT ----------`);
            console.log(`Found ${totalGames} rows to process.`);

            for (const [index, row] of gamesFromCsv.entries()) {
                const rowNum = index + 1;
                const gameName = row.Game || 'Unknown Game';
                
                console.group(`Row ${rowNum}/${totalGames}: Processing "${gameName}"`);
                console.log('1. Raw CSV data:', row);

                callbacks.onMessage(`[${rowNum}/${totalGames}] Processing: ${gameName}`);
                callbacks.onProgress({ current: rowNum, total: totalGames });

                const slug = getSlugFromUrl(row.Url);
                if (!slug) {
                    console.warn('SKIPPED: Invalid URL. Cannot extract slug.');
                    skippedCount++;
                    console.groupEnd();
                    continue;
                }
                console.log(`2. Extracted slug: "${slug}"`);

                // 3. Search game by slug to get our own data format and confirm existence
                const searchUrl = `/api/search-game?q=${encodeURIComponent(slug)}`;
                console.log(`3. Calling search API: ${searchUrl}`);
                const searchResponse = await fetch(searchUrl);
                console.log(`--> Search API response status: ${searchResponse.status}`);

                if (!searchResponse.ok) {
                    console.warn('SKIPPED: Search API call failed.');
                    skippedCount++;
                    console.groupEnd();
                    continue;
                }
                const searchResults = await searchResponse.json();
                const gameFromSearch = searchResults[0];

                if (!gameFromSearch || !gameFromSearch.id) {
                    console.warn('SKIPPED: No precise match found from search API.');
                    skippedCount++;
                    console.groupEnd();
                    continue;
                }
                console.log('--> Found game via search:', gameFromSearch);

                // 4. Check for duplicates
                const isDuplicate = currentAllGames.some(g => g.rawg_id === gameFromSearch.id);
                console.log(`4. Checking for duplicate using found RAWG ID: ${gameFromSearch.id}`);
                if (isDuplicate) {
                    console.warn(`SKIPPED: Game "${gameFromSearch.title}" is already in the library.`);
                    skippedCount++;
                    console.groupEnd();
                    continue;
                }
                console.log('--> Game is not a duplicate.');

                // 5. Get detailed game info
                callbacks.onMessage(`[${rowNum}/${totalGames}] Getting details for: ${gameFromSearch.title}`);
                const detailsUrl = `/api/game-details?id=${gameFromSearch.id}`;
                console.log(`5. Calling details API: ${detailsUrl}`);
                const detailsResponse = await fetch(detailsUrl);
                console.log(`--> Details API response status: ${detailsResponse.status}`);
                const gameDetails = detailsResponse.ok ? await detailsResponse.json() : {};
                if (!detailsResponse.ok) {
                    console.warn('Could not get game details, proceeding with basic info.');
                }

                // 6. Map data
                const { stars, isFavorite } = getRatingMapping(row.Rating);
                const gameTags = row.Rating ? [row.Rating] : [];

                // Robust date parsing
                const createdDate = row.Created ? new Date(row.Created) : null;
                const finalDate = (createdDate && !isNaN(createdDate.getTime())) ? createdDate : new Date();

                const newGame = {
                    userId: currentUser.uid,
                    rawg_id: gameFromSearch.id,
                    title: gameFromSearch.title,
                    year: gameFromSearch.year,
                    image_url: gameFromSearch.image_url,
                    genres: gameFromSearch.genres || [],
                    developer: gameDetails.developer || [],
                    publisher: gameDetails.publisher || [],
                    series: gameDetails.series || '',
                    status: row.Status || 'backlog',
                    date_added: finalDate,
                    user_rating: stars,
                    is_favorite: isFavorite,
                    user_note: row.Review || '',
                    play_time: 0,
                    markdown_content: '',
                    tags: gameTags
                };
                console.log('6. Prepared new game object for saving:', newGame);

                // 7. Add to batch
                const gameRef = doc(collection(db, 'users', currentUser.uid, 'games'));
                batch.set(gameRef, newGame);
                addedCount++;
                console.log('--> SUCCESS: Added to batch.');

                // 8. Collect new categories and tags
                if (row.Status && !currentUserSettings.categories.includes(row.Status)) {
                    newCategories.add(row.Status);
                }
                if (row.Rating && !currentUserSettings.tags.includes(row.Rating)) {
                    newTags.add(row.Rating);
                }
                console.groupEnd();
            }

            // 9. Update user settings if needed
            if (newCategories.size > 0 || newTags.size > 0) {
                callbacks.onMessage('Updating your categories and tags...');
                console.log('Updating user categories and tags...', { newCategories: [...newCategories], newTags: [...newTags] });
                const settingsRef = doc(db, 'users', currentUser.uid);
                await updateDoc(settingsRef, {
                    categories: arrayUnion(...Array.from(newCategories)),
                    tags: arrayUnion(...Array.from(newTags))
                });
            }

            // 10. Commit batch
            if (addedCount > 0) {
                callbacks.onMessage(`Saving ${addedCount} games to your library...`);
                console.log(`Committing batch with ${addedCount} new games.`);
                await batch.commit();
                console.log('Batch commit successful.');
            } else {
                console.log('No new games to commit.');
            }
            
            console.log(`---------- IMPORT FINISHED ----------`);
            console.log(`Total rows processed: ${totalGames}`);
            console.log(`Games added: ${addedCount}`);
            console.log(`Games skipped: ${skippedCount}`);
            console.log(`------------------------------------`);

            callbacks.onComplete({ added: addedCount, skipped: skippedCount });
        },
        error: (error) => {
            console.error("CRITICAL: CSV parsing error:", error);
            callbacks.onError(`Error parsing CSV: ${error.message}`);
        }
    });
}
