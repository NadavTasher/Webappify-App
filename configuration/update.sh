#!/usr/bin/env bash
while :
do
	php /var/www/html/server/cronjob.php
    sleep 3600
done
