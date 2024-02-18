CREATE TABLE IF NOT EXISTS `transactions` (
    `id` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    `reference` VARCHAR(255) NOT NULL,
    `value_date` DATE NOT NULL,
    `sum` DECIMAL(20, 2) NOT NULL,
    `entry_type` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_transaction` (`reference`,`type`),
    INDEX `transaction_id_idx` (`id`)
);

CREATE TABLE IF NOT EXISTS `card_operations` (
    `transaction_id` VARCHAR(255) NOT NULL,
    `recipient` VARCHAR(255) NOT NULL,
    `instrument` VARCHAR(255),
    `sum` DECIMAL(20, 2),
    `currency` VARCHAR(255),
    PRIMARY KEY (`transaction_id`),
    CONSTRAINT `fk_card_operations_transaction_id` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `standard_transfers` (
    `transaction_id` VARCHAR(255) NOT NULL,
    `recipient` VARCHAR(255) NOT NULL,
    `recipient_iban` VARCHAR(255),
    `description` TEXT,
    PRIMARY KEY (`transaction_id`),
    CONSTRAINT `fk_standard_transfer_transaction_id` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `google_oauth2_tokens` (
    `user_email` VARCHAR(255) NOT NULL,
    `access_token` VARCHAR(255) NOT NULL,
    `refresh_token` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`user_email`),
    UNIQUE KEY `unique_google_oauth2_tokens_user_email` (`user_email`),
    INDEX `google_oauth2_tokens_user_email_idx` (`user_email`)
);
