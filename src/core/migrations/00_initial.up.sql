CREATE TABLE IF NOT EXISTS `transactions` (
    `id` VARCHAR(255) NOT NULL UNIQUE,
    `date` DATETIME NOT NULL,
    `reference` VARCHAR(255) NOT NULL,
    `value_date` DATETIME NOT NULL,
    `sum` DECIMAL(20, 2) NOT NULL,
    `entry_type` ENUM('NONE', 'CREDIT', 'DEBIT', 'INVALID') NOT NULL,
    `type` ENUM('UNKNOWN', 'CARD_OPERATION', 'CROSS_BORDER_TRANSFER', 'PERIODIC_FEE', 'INTERBANK_TRANSFER_FEE', 'TRANSFER_FEE', 'CROSS_BORDER_TRANSFER_FEE', 'INTERNAL_TRANSFER_FEE', 'WITHDRAWAL_FEE', 'DESK_WITHDRAWAL', 'INTEREST_PAYMENT', 'INTEREST_TAX', 'INTERNAL_TRANSFER', 'INTERBANK_TRANSFER', 'UTILITY_PAYMENT', 'RECEIVED_INTERBANK_TRANSFER', 'RECEIVED_INTERNAL_PAYMENT', 'PERIODIC_PAYMENT', 'PRINCIPAL_REPAYMENT', 'INSURANCE_PREMIUM', 'INTEREST_REPAYMENT') NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE `unique-transaction` (`reference`, `type`),
    INDEX `transactions_id` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `card_operations` (
    `transaction_id` VARCHAR(255) NOT NULL UNIQUE,
    `recipient` VARCHAR(255) NOT NULL,
    `instrument` VARCHAR(255),
    `sum` DECIMAL(20, 2),
    `currency` VARCHAR(255),
    PRIMARY KEY (`transaction_id`),
    FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
    INDEX `card_operations_transaction_id` (`transaction_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `standard_transfers` (
    `transaction_id` VARCHAR(255) NOT NULL UNIQUE,
    `recipient` VARCHAR(255) NOT NULL,
    `recipient_iban` VARCHAR(255),
    `description` VARCHAR(255),
    PRIMARY KEY (`transaction_id`),
    FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
    INDEX `standard_transfers_transaction_id` (`transaction_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `google_oauth2_tokens` (
    `user_email` VARCHAR(255) NOT NULL UNIQUE,
    `access_token` VARCHAR(255) NOT NULL,
    `refresh_token` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`user_email`),
    INDEX `google_oauth2_tokens_user_email` (`user_email`)
) ENGINE=InnoDB;
