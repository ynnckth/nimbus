# Nimbus

Highly inaccurate flight instrument information for the casual passenger to increase spacial awareness and hopefully reduce anxiety during low-visibility flights.

The "attitude indicator" is a flight instrument that shows the plane's pitch and roll relative to the horizon.
This project focuses on approximating the roll angle of the plane by measuring the rate of change of the plane's absolute heading and translating that to the angle of the horizon in relation to the plane.

The PWA is enabled for offline use during the flight.

## 💻 Dev Setup

You will need to run and access the webapp via HTTPS locally for the device sensors to work. 

Generate self-signed cert: 
```shell
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

Run simple http-server to serve the project files:
```shell
npx http-server . -p 8080 --ssl --cert cert.pem --key key.pem
```

Access the app at:
> https://[YOUR_IP]:8080

## Ideas

- [ ] Show procedurally generated terrain
- [ ] Show individual elevation panel (climbing/descending)

- [ ] Introduce bottom tab navigation
- [ ] Add tab containing map/route (world map with major city names), show approximate location and heading
- [ ] Add option to enter origin and desitnation and approximate route (with average flight duration?)
- [ ] Wrap the webapp in a iOS app using cordova or similar framework
