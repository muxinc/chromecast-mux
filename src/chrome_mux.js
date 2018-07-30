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
  let isPaused = false;
  let videoSourceWidth = 0;
  let videoSourceHeight = 0;
  let firstPlay = true;
  let videoChanged = false;

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
      player_is_pause: isPaused,
      video_source_width: videoSourceWidth,
      video_source_height: videoSourceHeight,

      // Preferred properties - these should be provided in this callback if possible
      // If any are missing, that is okay, but this will be a lack of data for the customer at a later time
      player_is_fullscreen: true,
      player_autoplay_on: autoplay,
      player_preload_on: undefined,
      video_source_url: mediaUrl,
      video_source_mime_type: contentType,
      video_source_duration: duration,

      // Optional properties - if you have them, send them, but if not, no big deal
      video_poster_url: postUrl,
      player_language_code: undefined,
    };
    return stateData;
  };

  let isSeeking = false;
  player.muxListener = function(event) {
    console.log('MuxCast: event ' + event.type);
    console.log(event);
    switch(event.type) {
      case cast.framework.events.EventType.REQUEST_LOAD:
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
        if (firstPlay) {
          firstPlay = false;
        } else {
          player.mux.emit('videochange', { video_title: title});
          videoChanged = true;
          player.mux.emit('ended');
        }
        player.mux.emit('loadstart');
        break;
      case cast.framework.events.EventType.MEDIA_FINISHED:
      case cast.framework.events.EventType.LIVE_ENDED:
        if (!videoChanged)
          player.mux.emit('ended');
        videoChanged = false;
        break;
      case cast.framework.events.EventType.REQUEST_STOP:
        stopMonitor(player);
        break;
      case cast.framework.events.EventType.MEDIA_STATUS:
        if (event.mediaStatus.videoInfo != undefined) {
          videoSourceWidth = event.mediaStatus.videoInfo.width;
          videoSourceHeight = event.mediaStatus.videoInfo.height;
        }
        if (event.mediaStatus.media != undefined &&
          event.mediaStatus.media.duration != undefined) {
          duration = event.mediaStatus.media.duration;
        }
        break;
      case cast.framework.events.EventType.SEEKING:
        isSeeking = true;
        player.mux.emit('seeking');
        break;
      case cast.framework.events.EventType.SEEKED:
        player.mux.emit('seeked');
        break;
      case cast.framework.events.EventType.PAUSE:
        isPaused = true;
        if (!isSeeking) {
          player.mux.emit('pause');
        }
        break;
      case cast.framework.events.EventType.PLAYING:
        isPaused = false;
        if (isSeeking) {
          isSeeking = false;
        } else {
          player.mux.emit('playing');
        }
        break;
      case cast.framework.events.EventType.ERROR:
        player.mux.emit('error', {
          player_error_code: event.detailedErrorCode,
          player_error_message: event.error ? JSON.stringify(event.error) : 'Unknown Error'
        });
        break;
      case cast.framework.events.EventType.BITRATE_CHANGED:
        player.mux.emit('ratechange');
        break;
      case cast.framework.events.EventType.TIME_UPDATE:
        currentTime = event.currentMediaTime;
        player.mux.emit('timeupdate');
        break;
      case cast.framework.events.EventType.SEGMENT_DOWNLOADED:
        let loadData = {
          request_event_type: 'SEGMENT_DOWNLOADED',
          request_start: Date.now() - event.downloadTime - 1,
          request_response_start:  Date.now() - event.downloadTime,
          request_response_end:  Date.now(),
          request_bytes_loaded: event.size,
          request_type: 'media'
        };
        player.mux.emit('requestcompleted', loadData);
        break;
      }
  };
  player.addEventListener(cast.framework.events.category.CORE,
    player.muxListener);
  player.addEventListener(cast.framework.events.category.FINE,
      player.muxListener);
  player.addEventListener(cast.framework.events.category.DEBUG,
      player.muxListener);

  // Lastly, initialize the tracking
  mux.init(playerID, options);
  player.mux.emit('loadstart');
};

const stopMonitor = function (player) {
  if (player.muxListener != undefined) {
    player.removeEventListener(player.muxListener);
    player.mux.emit('destroy');
    player.mux.emit = function(){};
  }
  player.muxListener = undefined;
};

export { monitorChromecastPlayer };
