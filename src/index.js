/* global cast */
import mux from 'mux-embed';

const log = mux.log;
const assign = mux.utils.assign;

// Helper function to generate "unique" IDs for the player if your player does not have one built in
const generateShortId = function () {
  return ('000000' + (Math.random() * Math.pow(36, 6) << 0).toString(36)).slice(-6);
};

const monitorChromecastPlayer = function (player, options) {
  // Prepare the data passed in
  options = options || {};

  options.data = assign({
    player_software_name: 'Cast Application Framework Player',
    player_software_version: cast.framework.VERSION,
    player_mux_plugin_name: 'chromecast-mux',
    player_mux_plugin_version: '[AIV]{version}[/AIV]'
  }, options.data);

  // Retrieve the ID and the player element
  const playerID = generateShortId();

  // Enable customers to emit events through the player instance
  player.mux = {};
  player.mux.emit = function (eventType, data) {
    mux.emit(playerID, eventType, data);
  };

  let currentTime = 0;
  let autoplay;
  let title;
  let mediaUrl;
  let contentType;
  let postUrl;
  let duration = 0;
  let isPaused = false;
  let videoSourceWidth = 0;
  let videoSourceHeight = 0;
  let firstPlay = true;
  let videoChanged = false;
  let isSeeking = false;

  // Return current playhead time in milliseconds
  options.getPlayheadTime = () => {
    return mux.utils.secondsToMs(currentTime);
  };

  options.getStateData = () => {
    return {
      player_width: 0,     // Note: undocumented <div class="player" id="castPlayer"> has a player width and height
      player_height: 0,
      player_is_paused: isPaused,
      video_source_width: videoSourceWidth,
      video_source_height: videoSourceHeight,

      player_autoplay_on: autoplay,
      player_preload_on: undefined,
      video_source_url: mediaUrl,
      video_source_mime_type: contentType,
      video_source_duration: duration,

      video_poster_url: postUrl,
      player_language_code: undefined
    };
  };

  player.muxListener = function (event) {
    log.info('MuxCast: event ', event);
    switch (event.type) {
      case cast.framework.events.EventType.REQUEST_LOAD:
        if (event.requestData.media !== undefined) {
          if (event.requestData.media.contentId !== undefined) {
            mediaUrl = event.requestData.media.contentId;
          }

          if (event.requestData.media.contentType !== undefined) {
            contentType = event.requestData.media.contentType;
          }

          if (event.requestData.media.metadata !== undefined) {
            if (event.requestData.media.metadata.title !== undefined) {
              title = event.requestData.media.metadata.title;
            }
            if (event.requestData.media.metadata.images !== undefined && event.requestData.media.metadata.images.length > 0) {
              postUrl = event.requestData.media.metadata.images[0].url;
            }
          }
        }
        if (event.requestData.autoplay !== undefined) {
          autoplay = event.requestData.autoplay;
        }

        if (firstPlay) {
          firstPlay = false;
        } else {
          player.mux.emit('videochange', { video_title: title });
          videoChanged = true;
          player.mux.emit('ended');
        }
        player.mux.emit('loadstart');
        player.mux.emit('play');
        break;
      case cast.framework.events.EventType.MEDIA_FINISHED:
      case cast.framework.events.EventType.LIVE_ENDED:
        if (!videoChanged) {
          player.mux.emit('ended');
        }
        videoChanged = false;
        break;
      case cast.framework.events.EventType.REQUEST_STOP:
        stopMonitor(player);
        break;
      case cast.framework.events.EventType.MEDIA_STATUS:
        if (event.mediaStatus.videoInfo !== undefined) {
          // Note: it appears the videoInfo field is always undefined
          videoSourceWidth = event.mediaStatus.videoInfo.width;
          videoSourceHeight = event.mediaStatus.videoInfo.height;
        }
        if (event.mediaStatus.media !== undefined &&
          event.mediaStatus.media.duration !== undefined) {
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
          // Note:
          // When a seek happens, cast sdk sends the `cast.framework.events.EventType.PAUSE`.
          // We need to suppress the player.mux.emit('pause') call, because if it goes out, in our data view, seek
          // events will become pause event
          player.mux.emit('pause');
        }
        break;
      case cast.framework.events.EventType.PLAYING:
        if (isPaused) {
          player.mux.emit('play');
        }
        if (isSeeking) {
          isSeeking = false;
        }
        isPaused = false;
        player.mux.emit('playing');
        break;
      case cast.framework.events.EventType.ERROR:
        player.mux.emit('error', {
          player_error_code: event.detailedErrorCode,
          player_error_message: event.error ? JSON.stringify(event.error) : 'Unknown Error'
        });
        break;
      case cast.framework.events.EventType.RATE_CHANGE:
        player.mux.emit('ratechange');
        break;
      case cast.framework.events.EventType.TIME_UPDATE:
        currentTime = event.currentMediaTime;
        player.mux.emit('timeupdate');
        break;
      case cast.framework.events.EventType.SEGMENT_DOWNLOADED:
        let now = Date.now();
        let loadData = {
          request_event_type: 'SEGMENT_DOWNLOADED',
          request_start: now - event.downloadTime - 1,
          request_response_start: now - event.downloadTime,
          request_response_end: now,
          request_bytes_loaded: event.size,
          request_type: 'media'
        };

        player.mux.emit('requestcompleted', loadData);
        break;
    }
  };
  player.addEventListener(cast.framework.events.category.CORE, player.muxListener);
  player.addEventListener(cast.framework.events.category.FINE, player.muxListener);
  player.addEventListener(cast.framework.events.category.DEBUG, player.muxListener);

  // Lastly, initialize the tracking
  mux.init(playerID, options);
  player.mux.emit('playerready');
};

const stopMonitor = function (player) {
  if (player.muxListener !== undefined) {
    player.removeEventListener(player.muxListener);
    player.mux.emit('destroy');
    player.mux.emit = function () {};
  }
  player.muxListener = undefined;
};

export default monitorChromecastPlayer;
