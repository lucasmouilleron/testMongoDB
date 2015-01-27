testMongoDB
===========

Install mongo server
--------------------
- `brew install mongodb` [Mac OS]
- `mkdir -p /path/to/data/db`
- `sudo mongod --fork --logpath /var/log/mongodb.log --port 27017 --dbpath /path/to/data`
- UI : http://www.girbal.net/umongo

Authentication
--------------
- Create admin user : 
    - `sudo mongod --fork --logpath /var/log/mongodb.log --port 27017 --dbpath /path/to/data`
    - `mongo --host the_host --port 27017`
    - `use admin`
    - `db.createUser({user: "admin", pwd: "iamagod", roles: [ "root" ]})`
    - kill mongodb
    - `sudo mongod ... --auth`

Tables
------
- `mongo --username admin --password iamagod admin --authenticationDatabase admin`
- `use main`
- `db.shops.ensureIndex({"loc":"2dsphere"})`
- `db.shops.ensureIndex({"name":"text"})`
- `db.shops.ensureIndex({"address.zip":1})`
- `db.shops.ensureIndex({"address.city":1})`
- `db.shops.ensureIndex({"date":1})`

Operations
----------
- Dump : `mongodump --username admin --password iamagod --authenticationDatabase admin --db main --collection shops`
- Restore : `mongorestore --username admin --password iamagod --db main --authenticationDatabase admin --collection shops dump/test/shops.bson`


Install php api
---------------
- Install autoconf [Mac OS]
    - `take autoconf`
    - `curl http://ftp.gnu.org/gnu/autoconf/autoconf-latest.tar.gz > autoconf.tar.gz && tar -xzf autoconf.tar.gz && cd autoconf-2.69 && ./configure && make`
    - `sudo make install`
    - `export PHP_AUTOCONF=/usr/local/bin/autoconf`
- `sudo pecl install mongo`
- `sudo vi /etc/php.ini` and add `extension=mongo.so`
- Install composer :
    - `curl -sS https://getcomposer.org/installer | php`
    - `mv composer.phar /usr/local/bin/composer`
- Install API deps : `cd api && composer install`

Map API
-------
- Demo account created on https://developer.here.com/myapps/app-details/5twHHror0c2KgeiMxSzJ#/
- More tiles http://leaflet-extras.github.io/leaflet-providers/preview/index.html

Miscs
-----
- //<?php $cursor = $shops->find()->sort(array("_id"=>-1))->limit($limit)->skip($skip);
- console.log(leafletEvents.getAvailableMapEvents());
- console.log(leafletEvents.getAvailableMarkerEvents());
- http://l-lin.github.io/font-awesome-animation/
- `sudo mongod --fork --logpath /var/log/mongodb.log --dbpath /Volumes/Data/Users/lmouille/Projects/haveidols/testMongoDB/data --auth`
- `sudo mongod --fork --logpath /var/log/mongodb.log --dbpath /Users/lucas/Projects/haveidols/testMongoDB/data --auth`
- `mongo --host localhost --port 27017 --username admin --password iamagod admin --authenticationDatabase admin`
- `mongodump --host localhost --port 27017 --username admin --password iamagod --authenticationDatabase admin --db main --collection shops`