FarmDirect
Saboor Islam l233028

how to run

client (mock mode, no server needed)
1. cd client
2. npm install
3. copy .env.example to .env (VITE_USE_MOCK=true)
4. npm run dev
5. open the link it shows
6. login with password "password" as customer@test.com, ali@farm.com (farmer), bilal@farm.com (farmer not verified yet), rider@test.com or admin@farmdirect.com

mongodb (local, no homebrew)
1. mongodb community is unpacked in ~/mongodb
2. ~/mongodb/current/bin/mongod --dbpath ~/mongodb/data --logpath ~/mongodb/log/mongod.log
3. leave it running

server
1. cd server
2. npm install
3. copy .env.example to .env (MONGO_URI is already the local one)
4. npm run dev
5. in client/.env set VITE_USE_MOCK=false so the client talks to the server
