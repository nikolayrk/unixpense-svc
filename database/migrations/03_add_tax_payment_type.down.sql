IF (EXISTS (SELECT * 
                FROM information_schema.COLUMNS
                WHERE TABLE_NAME = 'transactions'
                  AND COLUMN_NAME = 'type'
                  AND (COLUMN_TYPE LIKE '%RECEIVED_CROSS_BORDER_TRANSFER%' 
                       OR COLUMN_TYPE LIKE '%TAX_PAYMENT%')
               )
   ) THEN
    ALTER TABLE `transactions`
        MODIFY COLUMN `type` ENUM(
            'UNKNOWN',
            'CARD_OPERATION',
            'CROSS_BORDER_TRANSFER',
            'PERIODIC_FEE',
            'INTERBANK_TRANSFER_FEE',
            'TRANSFER_FEE',
            'CROSS_BORDER_TRANSFER_FEE',
            'INTERNAL_TRANSFER_FEE',
            'WITHDRAWAL_FEE',
            'DESK_WITHDRAWAL',
            'INTEREST_PAYMENT',
            'INTEREST_TAX',
            'INTERNAL_TRANSFER',
            'INTERBANK_TRANSFER',
            'UTILITY_PAYMENT',
            'RECEIVED_INTERBANK_TRANSFER',
            'RECEIVED_INTERNAL_PAYMENT',
            'PERIODIC_PAYMENT',
            'PRINCIPAL_REPAYMENT',
            'INSURANCE_PREMIUM',
            'INTEREST_REPAYMENT'
        ) NOT NULL;
END IF;