SET @cardOperationsInstrument = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE table_name = 'card_operations'
    AND index_type = 'FULLTEXT'
    AND column_name = 'instrument'
);

SET @cardOperationsRecipient = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE table_name = 'card_operations'
    AND index_type = 'FULLTEXT'
    AND column_name = 'recipient'
);

SET @standardTransfersDescription = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE table_name = 'standard_transfers'
    AND index_type = 'FULLTEXT'
    AND column_name = 'description'
);

SET @standardTransfersRecipient = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE table_name = 'standard_transfers'
    AND index_type = 'FULLTEXT'
    AND column_name = 'recipient'
);

IF @cardOperationsInstrument = 0 THEN
    ALTER TABLE `card_operations` ADD FULLTEXT INDEX `card_operations_instrument` (`instrument`);
END IF;

IF @cardOperationsRecipient = 0 THEN
    ALTER TABLE `card_operations` ADD FULLTEXT INDEX `card_operations_recipient` (`recipient`);
END IF;

IF @standardTransfersDescription = 0 THEN
    ALTER TABLE `standard_transfers` ADD FULLTEXT INDEX `standard_transfers_description` (`description`);
END IF;

IF @standardTransfersRecipient = 0 THEN
    ALTER TABLE `standard_transfers` ADD FULLTEXT INDEX `standard_transfers_recipient` (`recipient`);
END IF;
