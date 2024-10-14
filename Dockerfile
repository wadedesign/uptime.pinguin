FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN apt-get update && apt-get install -y cron

RUN echo '#!/bin/sh\ncurl http://localhost:4999/api/run-monitoring' > /app/run-monitoring.sh
RUN chmod +x /app/run-monitoring.sh

RUN echo "*/5 * * * * /app/run-monitoring.sh >> /var/log/cron.log 2>&1" | crontab -

RUN echo '#!/bin/sh\nservice cron start\nnpm start' > /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 4999

CMD ["/app/start.sh"]
