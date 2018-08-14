# chromecast-mux

This is the Mux Data SDK for Chromecast applications, providing performance analytics on your Chromecast applications.

## SDK Overview

Mux Data supports Chromecast applications that are built on top of the Cast Application Framework [CAF](https://developers.google.com/cast/docs/caf_receiver_overview) Receiver SDK. The CAF Receiver SDK supports the following [streaming protocols](https://developers.google.com/cast/docs/media#delivery-methods-and-adaptive-streaming-protocols).

For integration instructions into your application, see our documentation here: https://docs.mux.com/docs/integration-guide-chromecast.

If you run into any issues, don't hesitate to get in touch!

## Directory Layout

```
 - sample_app
   - sender - Sample sender application, in Java
   - receiver - Sample custom receiver application
 - scripts - deployment scripts
 - src
   - index.js - Mux integration
   - entry.js - packaging file
```

A Chromecast application contains two main components: a sender and a receiver. The Mux Data SDK is integrated at the receiver side. This repo also includes a sample sender and receiver application.

## Sample Sender App

The sender app is located under sample_app/sender directory. You will need to load this in Android Studio. Build and run the app. When you connect with a Chromecast device, it will automatically cast the video as listed inside the `onSesssionStarted` call.

## Sample Receiver App

The receiver app is located under sample_app/receiver. The main component is `sample_app/reciever/js/main.js`, which is a very simple custom receiver app. When a sender has connected with the receiver, a call to `initChromecastMux` will setup everything for you.

## Mux Data Integration

The Mux Data integration, which uses `mux-embed` (the core Mux JavaScript SDK), is comprised of the scripts within the `src` directory. The integration itself is written using ES6 and various other dependencies, managed via `yarn`. This is then compiled and minified using Webpack, to be hosted via https://src.litix.io/chromecast/[major_version]/chromecast-mux.js.

## Release Notes

### Current Release
#### v0.1.0
- Initial SDK created.
