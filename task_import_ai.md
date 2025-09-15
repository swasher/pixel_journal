Мы сделали пункт меню в Header.svelte для импорта csv файла. 
Теперь сделаем логику импорта в отдельном файле. В CSV нет 
явного ID для игры, поэтому игру нужно "вытянуть" с rawg.io по 
косвенному признаку, например столбцу url. Далее для каждой игры. 
Далее следуем таким принципам:

- Столбец Status: преобразовываем в Category (создаем если отсутствует)
- Столбец Created: это date_added (дата прохождения)
- Столбец Rating: преобразовываем в звезды И теги - тег ставим такой же, как Rating, а звезды по такому принципу: exceptional - 5, recommended - 4, meh - 3, skip - 1

Пример файла csv:

Game,Released,Game platforms,Status,Played on,Created,Updated,Rating,Review,Rating Created,Url
Battlevoid: Sector Siege,2017-10-25,"iOS, Android, Linux, PC, macOS",Played,,2025-07-17 19:06:38,2025-07-17 19:06:43,meh,,2025-07-17 19:06:51,https://rawg.io/games/battlevoid-sector-siege
Call of Duty: Modern Warfare Remastered,2016-10-05,"Xbox One, PlayStation 4, PC",Played,,2025-07-13 16:35:31,2025-07-13 16:35:34,,,,https://rawg.io/games/call-of-duty-modern-warfare-remastered
Far Cry 4,2014-11-18,"PlayStation 4, PlayStation 3, PC, Xbox One, Xbox 360",Completed,,2025-06-04 18:37:59,2025-06-04 18:55:40,recommended,,2025-06-04 18:37:57,https://rawg.io/games/far-cry-4
