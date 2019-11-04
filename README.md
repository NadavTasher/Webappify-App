# Webappify.org

Add these lines to crontab:
```
0 8 * * * cd /directory/home/scripts/host && php update.php
0 8 * * * cd /directory/home/scripts/host && php scan.php
```