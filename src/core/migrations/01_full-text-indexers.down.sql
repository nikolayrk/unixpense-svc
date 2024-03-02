ALTER TABLE `card_operations` DROP INDEX `card_operations_instrument`;

ALTER TABLE `card_operations` DROP INDEX `card_operations_recipient`;

ALTER TABLE `standard_transfers` DROP INDEX `standard_transfers_description`;

ALTER TABLE `standard_transfers` DROP INDEX `standard_transfers_recipient`;
