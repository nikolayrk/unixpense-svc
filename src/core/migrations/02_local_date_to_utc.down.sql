UPDATE `transactions`
SET `date` = (
    SELECT CONVERT_TZ(`date`, '+00:00',
        CASE WHEN MONTH(`date`) BETWEEN 3 AND 10 THEN
            CASE WHEN MONTH(`date`) = 3 THEN
                CASE WHEN DAYOFWEEK(`date`) = 1
                AND DAY(`date`) > 7
                AND DATE_ADD(`date`, INTERVAL 1 DAY) >= (
                    -- https://stackoverflow.com/a/5268289
                    LAST_DAY(`date`) - ((7 + WEEKDAY(LAST_DAY(`date`)) - 1) % 7)
                ) THEN '+03:00'
                ELSE '+02:00'
                END
            WHEN MONTH(`date`) = 10 THEN
                CASE WHEN DAYOFWEEK(`date`) = 1
                AND DAY(`date`) > 7
                AND DATE_ADD(`date`, INTERVAL 1 DAY) >= (
                    -- https://stackoverflow.com/a/5268289
                    LAST_DAY(`date`) - ((7 + WEEKDAY(LAST_DAY(`date`)) - 1) % 7)
                ) THEN '+03:00'
                ELSE '+02:00'
                END
            ELSE '+03:00'
            END
        ELSE '+02:00'
        END
    )
    FROM `transactions` AS `t2`
    WHERE `t2`.`id` = `transactions`.`id`
)
WHERE EXISTS (
    SELECT 1
    FROM `transactions` AS `t2`
    WHERE `t2`.`id` = `transactions`.`id`
);