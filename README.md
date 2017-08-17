# Argus

Monitors websites and notifys users once they change.

![Screenshot](https://raw.githubusercontent.com/maxbeier/Argus/master/screenshot.png)


## Setup

```
git clone https://github.com/maxbeier/Argus
cd argus
npm install
node index.js

# with pm2
pm2 start index.js --name "argus"
pm2 start scraper.js --name "argus cron" --cron "*/10 * * * *" # run every 10 minutes
```


## Development

```sh
nodemon --inspect index.js --ignore db.json
```

