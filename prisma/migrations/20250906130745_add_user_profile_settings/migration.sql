-- CreateTable
CREATE TABLE `UserProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `occupation` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `socialLinks` JSON NULL,
    `height` DOUBLE NULL,
    `weight` DOUBLE NULL,
    `bloodType` VARCHAR(191) NULL,
    `emergencyContact` VARCHAR(191) NULL,
    `emergencyPhone` VARCHAR(191) NULL,
    `profilePicture` VARCHAR(191) NULL,
    `coverImage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSettings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `emailNotifications` BOOLEAN NOT NULL DEFAULT true,
    `pushNotifications` BOOLEAN NOT NULL DEFAULT false,
    `smsNotifications` BOOLEAN NOT NULL DEFAULT false,
    `newsletterSubscribed` BOOLEAN NOT NULL DEFAULT true,
    `appointmentReminders` BOOLEAN NOT NULL DEFAULT true,
    `medicationReminders` BOOLEAN NOT NULL DEFAULT true,
    `vitalReminders` BOOLEAN NOT NULL DEFAULT true,
    `labResultAlerts` BOOLEAN NOT NULL DEFAULT true,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'light',
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'UTC',
    `dateFormat` VARCHAR(191) NOT NULL DEFAULT 'MM/DD/YYYY',
    `timeFormat` VARCHAR(191) NOT NULL DEFAULT '12h',
    `unitSystem` VARCHAR(191) NOT NULL DEFAULT 'metric',
    `temperatureUnit` VARCHAR(191) NOT NULL DEFAULT 'celsius',
    `profileVisibility` VARCHAR(191) NOT NULL DEFAULT 'private',
    `showEmail` BOOLEAN NOT NULL DEFAULT false,
    `showPhone` BOOLEAN NOT NULL DEFAULT false,
    `showLocation` BOOLEAN NOT NULL DEFAULT false,
    `dataRetentionDays` INTEGER NOT NULL DEFAULT 365,
    `lastExportDate` DATETIME(3) NULL,
    `exportFormat` VARCHAR(191) NOT NULL DEFAULT 'json',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserSettings_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSettings` ADD CONSTRAINT `UserSettings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
