# Database Schema

## Enums

### `titleStatus` (used in `titles` table)
- `ongoing`
- `completed`
- `cancelled`
- `hiatus`

### `titleType` (used in `titles` table)
- `manga`
- `manhwa`
- `manhua`
- `comic`
- `other`

### `chapterStatus` (used in `chapters` table)
- `draft`
- `published`
- `hidden`
- `deleted`

### `role` (used in `users` table)
- `owner`
- `admin`
- `moderator`
- `user`

### `rating` (used in `rating` table)
- `1`
- `2`
- `3`
- `4`
- `5`
- `6`
- `7`
- `8`
- `9`
- `10`

### `genre` (used in `genres` table via `name` column)
- Note: The specific genres are defined dynamically or assumed to be populated in the `genres` table. The implementation uses `varchar` for the `name` in `genresTable`.

## Tables

### `users`
| Column Name | Data Type    | Constraints                     | Description                     |
|-------------|--------------|---------------------------------|---------------------------------|
| `id`        | UUID         | PRIMARY KEY, DEFAULT RANDOM()   | Unique identifier for the user  |
| `username`  | VARCHAR(255) | UNIQUE, NOT NULL                | User's chosen username          |
| `email`     | VARCHAR(255) | UNIQUE, NOT NULL                | User's email address            |
| `password`  | VARCHAR(255) | NOT NULL                        | Hashed password (or similar)    |
| `role`      | `role` Enum  | NOT NULL, DEFAULT 'user'        | User's role                     |
| `createdAt` | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of account creation |
| `updatedAt` | TIMESTAMP    | NOT NULL, ON UPDATE CURRENT_TIMESTAMP | Timestamp of last update    |

### `authors`
| Column Name | Data Type    | Constraints                     | Description                     |
|-------------|--------------|---------------------------------|---------------------------------|
| `id`        | UUID         | PRIMARY KEY, DEFAULT RANDOM()   | Unique identifier for author    |
| `name`      | VARCHAR(255) | NOT NULL                        | Author's name                   |
| `createdAt` | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of author creation    |
| `updatedAt` | TIMESTAMP    | NOT NULL, ON UPDATE CURRENT_TIMESTAMP | Timestamp of last update      |

### `upload_teams`
| Column Name | Data Type    | Constraints                     | Description                     |
|-------------|--------------|---------------------------------|---------------------------------|
| `id`        | UUID         | PRIMARY KEY, DEFAULT RANDOM()   | Unique identifier for the team  |
| `name`      | VARCHAR(255) | NOT NULL                        | Name of the upload team         |
| `createdAt` | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of team creation      |
| `updatedAt` | TIMESTAMP    | NOT NULL, ON UPDATE CURRENT_TIMESTAMP | Timestamp of last update      |

### `genres`
| Column Name | Data Type    | Constraints                     | Description                    |
|-------------|--------------|---------------------------------|--------------------------------|
| `id`        | UUID         | PRIMARY KEY, DEFAULT RANDOM()   | Unique identifier for the genre|
| `name`      | VARCHAR(255) | NOT NULL                        | Name of the genre              |
| `createdAt` | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of genre creation    |
| `updatedAt` | TIMESTAMP    | NOT NULL, ON UPDATE CURRENT_TIMESTAMP | Timestamp of last update     |

### `titles`
| Column Name   | Data Type         | Constraints                     | Description                      |
|---------------|-------------------|---------------------------------|----------------------------------|
| `id`          | UUID              | PRIMARY KEY, DEFAULT RANDOM()   | Unique identifier for the title  |
| `title`       | VARCHAR(255)      | NOT NULL                        | Name/Title of the content        |
| `slug`        | VARCHAR(255)      | NOT NULL                        | URL-friendly slug for the title  |
| `description` | TEXT              |                                 | Synopsis or description          |
| `authorId`    | UUID              | FOREIGN KEY (`authors`.`id`)    | ID of the author                 |
| `uploaderId`  | UUID              | FOREIGN KEY (`users`.`id`)      | ID of the user who uploaded      |
| `status`      | `titleStatus` Enum| NOT NULL, DEFAULT 'ongoing'     | Current status of the title      |
| `type`        | `titleType` Enum  | NOT NULL, DEFAULT 'manga'       | Type of the title                |
| `year`        | INTEGER           |                                 | Publication year                 |
| `createdAt`   | TIMESTAMP         | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of title creation    |
| `updatedAt`   | TIMESTAMP         | NOT NULL, ON UPDATE CURRENT_TIMESTAMP | Timestamp of last update       |

### `title_genres` (Join Table)
| Column Name | Data Type  | Constraints                     | Description                 |
|-------------|------------|---------------------------------|-----------------------------|
| `id`        | UUID       | PRIMARY KEY, DEFAULT RANDOM()   | Unique identifier for the link |
| `titleId`   | UUID       | NOT NULL, FOREIGN KEY (`titles`.`id`) | ID of the title         |
| `genreId`   | UUID       | NOT NULL, FOREIGN KEY (`genres`.`id`) | ID of the genre         |
*Note: A unique constraint on (`titleId`, `genreId`) is recommended.*

### `title_covers`
| Column Name | Data Type    | Constraints                     | Description                     |
|-------------|--------------|---------------------------------|---------------------------------|
| `id`        | UUID         | PRIMARY KEY, DEFAULT RANDOM()   | Unique identifier for the cover |
| `titleId`   | UUID         | NOT NULL, FOREIGN KEY (`titles`.`id`) | ID of the associated title    |
| `imageUrl`  | VARCHAR(2048)| NOT NULL                        | URL of the cover image          |
| `createdAt` | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of cover upload       |
| `updatedAt` | TIMESTAMP    | NOT NULL, ON UPDATE CURRENT_TIMESTAMP | Timestamp of last update      |

### `chapters`
| Column Name    | Data Type    | Constraints                     | Description                        |
|----------------|--------------|---------------------------------|------------------------------------|
| `id`           | UUID         | PRIMARY KEY, DEFAULT RANDOM()   | Unique identifier for the chapter  |
| `name`         | VARCHAR(255) | NOT NULL                        | Name/Title of the chapter        |
| `slug`         | VARCHAR(255) | NOT NULL                        | URL-friendly slug for the chapter|
| `chapterNumber`| INTEGER      | NOT NULL                        | Chapter number (e.g., 1, 2, 3)     |
| `volumeNumber` | INTEGER      |                                 | Volume number chapter belongs to |
| `pages`        | INTEGER      | NOT NULL                        | Number of pages in the chapter     |
| `titleId`      | UUID         | NOT NULL, FOREIGN KEY (`titles`.`id`) | ID of the parent title           |
| `uploaderId`   | UUID         | FOREIGN KEY (`users`.`id`)      | ID of the user who uploaded      |
| `uploadTeamId` | UUID         | FOREIGN KEY (`upload_teams`.`id`) | ID of the team responsible       |
| `createdAt`    | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of chapter creation    |
| `updatedAt`    | TIMESTAMP    | NOT NULL, ON UPDATE CURRENT_TIMESTAMP | Timestamp of last update       |
*Note: `UNIQUE(titleId, chapterNumber)` constraint should be added.*
*Note: `status` column from previous schema/TS file seems missing in current `chapters.schema.ts`.*

### `chapter_covers`
| Column Name | Data Type    | Constraints                     | Description                     |
|-------------|--------------|---------------------------------|---------------------------------|
| `id`        | UUID         | PRIMARY KEY, DEFAULT RANDOM()   | Unique identifier for the cover |
| `chapterId` | UUID         | NOT NULL, FOREIGN KEY (`chapters`.`id`) | ID of the associated chapter  |
| `imageUrl`  | VARCHAR(2048)| NOT NULL                        | URL of the cover image          |
| `createdAt` | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of cover upload       |
| `updatedAt` | TIMESTAMP    | NOT NULL, ON UPDATE CURRENT_TIMESTAMP | Timestamp of last update      |

### `chapter_images`
| Column Name  | Data Type    | Constraints                     | Description                         |
|--------------|--------------|---------------------------------|-------------------------------------|
| `id`         | UUID         | PRIMARY KEY, DEFAULT RANDOM()   | Unique identifier for the image     |
| `chapterId`  | UUID         | NOT NULL, FOREIGN KEY (`chapters`.`id`) | ID of the associated chapter    |
| `imageUrl`   | VARCHAR(2048)| NOT NULL                        | URL of the chapter content image    |
| `pageNumber` | INT          | NOT NULL                        | Order of the image within the chapter |
| `createdAt`  | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of image upload           |
| `updatedAt`  | TIMESTAMP    | NOT NULL, ON UPDATE CURRENT_TIMESTAMP | Timestamp of last update        |
*Note: `UNIQUE(chapterId, pageNumber)` constraint should be added.*

### `comments`
| Column Name | Data Type | Constraints                     | Description                               |
|-------------|-----------|---------------------------------|-------------------------------------------|
| `id`        | UUID      | PRIMARY KEY, DEFAULT RANDOM()   | Unique identifier for the comment         |
| `content`   | TEXT      | NOT NULL                        | The text content of the comment           |
| `userId`    | UUID      | NOT NULL, FOREIGN KEY (`users`.`id`) | ID of the user who wrote the comment    |
| `titleId`   | UUID      | FOREIGN KEY (`titles`.`id`)     | ID of the title the comment is on (optional) |
| `chapterId` | UUID      | FOREIGN KEY (`chapters`.`id`)   | ID of the chapter the comment is on (optional)|
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of comment creation           |
| `updatedAt` | TIMESTAMP | NOT NULL, ON UPDATE CURRENT_TIMESTAMP | Timestamp of last update              |

### `rating`
| Column Name | Data Type    | Constraints                     | Description                      |
|-------------|--------------|---------------------------------|----------------------------------|
| `id`        | UUID         | PRIMARY KEY, DEFAULT RANDOM()   | Unique identifier for the rating |
| `rating`    | `rating` Enum| NOT NULL                        | The rating value (1-10)          |
| `userId`    | UUID         | NOT NULL, FOREIGN KEY (`users`.`id`) | ID of the user giving the rating |
| `titleId`   | UUID         | NOT NULL, FOREIGN KEY (`titles`.`id`) | ID of the title being rated    |
| `createdAt` | TIMESTAMP    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of rating creation     |
| `updatedAt` | TIMESTAMP    | NOT NULL, ON UPDATE CURRENT_TIMESTAMP | Timestamp of last update       |
*Note: `UNIQUE(userId, titleId)` constraint is likely needed.*

## Relationships Summary (Based on `index.ts`)

- **Users & Titles (Uploads):** One-to-Many (`users` -> `titles` via `uploaderId`)
- **Users & Chapters (Uploads):** One-to-Many (`users` -> `chapters` via `uploaderId`)
- **Users & Comments:** One-to-Many (`users` -> `comments` via `userId`)
- **Users & Ratings:** One-to-Many (`users` -> `ratings` via `userId`)
- **Authors & Titles:** One-to-Many (`authors` -> `titles` via `authorId`)
- **Upload Teams & Chapters:** One-to-Many (`upload_teams` -> `chapters` via `uploadTeamId`)
- **Titles & Chapters:** One-to-Many (`titles` -> `chapters` via `titleId`)
- **Titles & Title Covers:** One-to-Many (`titles` -> `title_covers` via `titleId`)
- **Titles & Comments:** One-to-Many (`titles` -> `comments` via `titleId`)
- **Titles & Ratings:** One-to-Many (`titles` -> `ratings` via `titleId`)
- **Titles & Genres:** Many-to-Many (`titles` <-> `title_genres` <-> `genres`)
- **Chapters & Chapter Covers:** One-to-Many (`chapters` -> `chapter_covers` via `chapterId`)
- **Chapters & Chapter Images:** One-to-Many (`chapters` -> `chapter_images` via `chapterId`)
- **Chapters & Comments:** One-to-Many (`chapters` -> `comments` via `chapterId`)
- **Genres & Titles (Implied):** Many-to-Many (See Titles & Genres)
