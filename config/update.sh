#!/usr/bin/env bash
while :
do
	php /var/www/html/home/scripts/server/cronjob.php
    sleep 3600
done
