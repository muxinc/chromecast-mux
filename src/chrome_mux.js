// import window from 'global/window'; // Remove if you do not need to access the global `window`
// import document from 'global/document'; // Remove if you do not need to access the global `document`
import mux from 'mux-embed';

const log = mux.log;
const assign = mux.utils.assign;
// const getComputedStyle = mux.utils.getComputedStyle; // If necessary to get

// Helper function to generate "unique" IDs for the player if your player does not have one built in
const generateShortId = function () {
  return ('000000' + (Math.random() * Math.pow(36, 6) << 0).toString(36)).slice(-6);
};

const monitorChromecastPlayer = function (player, options) {
  // Accessor for event namespace if used by your player
  // const YOURPLAYER_EVENTS = || {};

  // Prepare the data passed in
  options = options || {};

  options.data = assign({
    player_software_name: 'Chromecast AVPlayer',
    player_software_version: cast.framework.VERSION, // Replace with method to retrieve the version of the player as necessary
    player_mux_plugin_name: 'Chromecast-mux',
    player_mux_plugin_version: '0.1.0',
  }, options.data);

  // Retrieve the ID and the player element
  const playerID = generateShortId(); // Replace with your own ID if you have one that's unique per player in page

  // Enable customers to emit events through the player instance
  player.mux = {};
  player.mux.emit = function (eventType, data) {
    mux.emit(playerID, eventType, data);
  };

  let currentTime = 0;
  let autoplay = undefined;
  let title = undefined;
  let mediaUrl = undefined;
  let contentType = undefined;
  let postUrl = undefined;
  let duration = 0;

  // Allow mux to retrieve the current time - used to track buffering from the mux side
  // Return current playhead time in milliseconds
  options.getPlayheadTime = () => {
    return currentTime * 1000;
  };

  // Allow mux to automatically retrieve state information about the player on each event sent
  // If these properties are not accessible through getters at runtime, you may need to set them
  // on certain events and store them in a local variable, and return them in the method e.g.
  //    let playerWidth, playerHeight;
  //    player.on('resize', (width, height) => {
  //      playerWidth = width;
  //      playerHeight = height;
  //    });
  //    options.getStateData = () => {
  //      return {
  //        ...
  //        player_width: playerWidth,
  //        player_height: playerHeight
  //      };
  //    };
  options.getStateData = () => {
    let stateData = {
      // Required properties - these must be provided every time this is called
      // You _should_ only provide these values if they are defined (i.e. not 'undefined')
      player_width: 0,
      player_height: 0,

      // Preferred properties - these should be provided in this callback if possible
      // If any are missing, that is okay, but this will be a lack of data for the customer at a later time
      player_is_fullscreen: true,
      player_autoplay_on: autoplay,
      player_preload_on: undefined,
      video_source_url: mediaUrl,
      video_source_mime_type: contentType,

      // Optional properties - if you have them, send them, but if not, no big deal
      video_poster_url: postUrl,
      player_language_code: undefined,
    };

    // Additional required properties
    /*var state = webapis.avplay.getState();
    stateData.player_is_paused = (state == 'NONE' || state == 'IDLE' || state == 'READY' || state == 'PAUSED');
    if (videoSourceWidth != 0) {
      stateData.video_source_width = videoSourceWidth;
    }
    if (videoSourceHeight != 0) {
      stateData.video_source_height = videoSourceHeight;
    }
    // Additional peferred properties
    if (lastPlayerState != 'NONE' && lastPlayerState != 'IDLE') {
      const duration = duration;
      stateData.video_source_duration = (duration == 0 ? Infinity : duration);
    }*/

    return stateData;
  };

  player.muxCoreListener = function(event) {
    switch(event.type) {
      case 'REQUEST_LOAD':
        if (event.requestData.media != undefined &&
          event.requestData.media.metadata != undefined &&
          event.requestData.media.metadata.title != undefined) {
          title = event.requestData.media.metadata.title;
        }
        if (event.requestData.autoplay != undefined) {
          autoplay = event.requestData.autoplay;
        }
        if (event.requestData.media != undefined &&
          event.requestData.media.contentId != undefined) {
          mediaUrl = event.requestData.media.contentId;
        }
        if (event.requestData.media != undefined &&
          event.requestData.media.contentType != undefined) {
          contentType = event.requestData.media.contentType;
        }
        if (event.requestData.media != undefined &&
          event.requestData.media.metadata != undefined &&
          event.requestData.media.metadata.images != undefined) {
          postUrl = event.requestData.media.metadata.images[0].url;
        }
        if (event.requestData.media != undefined &&
          event.requestData.media.duration != undefined) {
          duration = event.requestData.media.duration;
        }
        console.log('MuxCast: ' + title + ',' + autoplay + ',' + mediaUrl + ',' + postUrl + ',' + duration);
        break;
      case 'ABORT':
      case 'ENDED':
      case 'MEDIA_FINISHED':
      case 'REQUEST_STOP':
      case 'LIVE_ENDED':
        stopMonitor(player);
        break;
    }
  };
  player.muxFineListener = function(event) {
    switch(event.type) {
      case 'TIME_UPDATE':
        currentTime = event.currentMediaTime;
        console.log('MuxCast: current time ' + currentTime);
        break;
      }
  };
  player.addEventListener(cast.framework.events.category.CORE, player.muxCoreListener);
  player.addEventListener(cast.framework.events.category.FINE, player.muxFineListener);

  // Lastly, initialize the tracking
  //mux.init(playerID, options);
};

const stopMonitor = function (player) {
  if (player.muxCoreListener != undefined) {
    console.log('MuxCast: deinit');
    player.removeEventListener(player.muxCoreListener);
    player.removeEventListener(player.muxFineListener);
    player.mux.emit('destroy');
    player.mux.emit = function(){};
  }
  player.muxCoreListener = undefined;
  player.muxFineListener = undefined;
};

export { monitorChromecastPlayer };
