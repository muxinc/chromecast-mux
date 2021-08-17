/* global cast */
import mux from 'mux-embed';

const log = mux.log;
const assign = mux.utils.assign;

// Helper function to generate "unique" IDs for the player if your player does not have one built in
const generateShortId = function () {
  return ('000000' + (Math.random() * Math.pow(36, 6) << 0).toString(36)).slice(-6);
};

const getModelInfo = function () {
  // https://developers.google.com/cast/docs/media#video_codecs
  try {
    const { hardwareConcurrency, userAgent } = window.navigator;
    const context = cast.framework.CastReceiverContext.getInstance();

    // Chromecast with Google TV supports 'H.264 High Profile, level 5.1'
    if (context.canDisplayType('video/mp4; codecs="avc1.640033')) return 'Chromecast with Google TV';
    // Android Devices with Chromecast built-in
    if (userAgent.includes('Android')) return 'Chromecast Android';
    // Chromecast Ultra supports 'HEVC main profile, level 3.1'
    if (context.canDisplayType('video/mp4; codecs=hev1.1.6.L93.B0')) return 'Chromecast Ultra';
    // 3rd generation Chromecast supports 'H.264 high profile, level 4.2'
    if (context.canDisplayType('video/mp4; codecs=avc1.64002A')) return 'Chromecast 3';
    // 2nd and 1st generation Chromecast can be differentiated by hardwareConcurrency
    if (hardwareConcurrency === 2) return 'Chromecast 2';
    if (hardwareConcurrency === 1) return 'Chromecast 1';
  } catch (e) {
      // do nothing
  }
  return 'Chromecast';
};

const monitorChromecastPlayer = function (player, options) {
  const defaults = {
    // Allow customers to be in full control of the "errors" that are fatal
    automaticErrorTracking: true,
    // Allow customers to emit videoChange, or set this to true for us to attempt to do this
    automaticVideoChange: false
  };

  options = assign(defaults, options);

  options.data = assign({
    player_software_name: 'Cast Application Framework Player',
    player_software_version: cast.framework.VERSION,
    player_mux_plugin_name: 'chromecast-mux',
    player_mux_plugin_version: '[AIV]{version}[/AIV]',
    player_remote_played: true,
    viewer_device_name: getModelInfo()
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
  let isSeeking = false;
  let inAdBreak = false;
  let adPlaying = false;
  let adBreakClips = null;

  // Return current playhead time in milliseconds
  options.getPlayheadTime = () => {
    if (typeof player.muxListener === 'undefined') { return; }
    return mux.utils.secondsToMs(currentTime);
  };

  options.getStateData = () => {
    if (typeof player.muxListener === 'undefined') { return {}; }
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
    options.debug ? log.info('MuxCast: event ', event) : null;

    if (inAdBreak) {
      // Chromecast will mix player messages with ad messages
      // Seperating out these ad events and supressing unneeded messages until the adbreak is over
      switch (event.type) {
        case cast.framework.events.EventType.BREAK_CLIP_LOADING:
          if (adBreakClips && event.breakClipId) {
            let breakClip = adBreakClips.find(o => o.id === event.breakClipId) || {};
            let adAssetUrl = breakClip.contentUrl || breakClip.contentId;

            // Ad Tag URL is defined, but Chromecast does some weird auto-generated break clip stuff which doesn't carry the adTagUrl through to the generated breaks
            // If google fix this, it can be added in the future
            player.mux.emit('adplay', {
              ad_asset_url: adAssetUrl
            });
          } else {
            player.mux.emit('adplay');
          }
          break;
        case cast.framework.events.EventType.PLAY: // cater for playback events within ad breaks, not captured by BREAK_ events
          if (adPlaying) { player.mux.emit('adplay'); };
          break;
        case cast.framework.events.EventType.PAUSE: // cater for playback events within ad breaks, not captured by BREAK_ events
          if (adPlaying) { player.mux.emit('adpause'); };
          break;
        case cast.framework.events.EventType.BREAK_CLIP_STARTED:
          player.mux.emit('adplaying');
          adPlaying = true;
          break;
        case cast.framework.events.EventType.PLAYING: // cater for playback events within ad breaks, not captured by BREAK_ events
          if (adPlaying) { player.mux.emit('adplaying'); };
          break;
        case cast.framework.events.EventType.BREAK_CLIP_ENDED:
          if (event.endedReason && event.endedReason === 'ERROR') { player.mux.emit('aderror'); };
          player.mux.emit('adended');
          adPlaying = false;
          break;
        case cast.framework.events.EventType.BREAK_ENDED:
          player.mux.emit('adbreakend');
          adPlaying = false;
          inAdBreak = false;
          break;
      }
    } else {
      // Not in an adbreak, regular playback monitoring
      switch (event.type) {
        case cast.framework.events.EventType.REQUEST_LOAD:
          // reset the playhead position as we're loading a new source
          currentTime = 0;

          if (event.requestData.media !== undefined) {
            if (event.requestData.media.contentUrl !== undefined) {
              mediaUrl = event.requestData.media.contentUrl;
            } else if (event.requestData.media.contentId !== undefined) {
              mediaUrl = event.requestData.media.contentId;
            }

            if (event.requestData.media.contentType !== undefined) {
              contentType = event.requestData.media.contentType.toLowerCase();
            }

            if (event.requestData.media.metadata !== undefined) {
              if (event.requestData.media.metadata.title !== undefined) {
                title = event.requestData.media.metadata.title;
              }
              if (event.requestData.media.metadata.images !== undefined && event.requestData.media.metadata.images.length > 0) {
                postUrl = event.requestData.media.metadata.images[0].url;
              }
            }

            if (event.requestData.media.breakClips !== undefined) {
              adBreakClips = event.requestData.media.breakClips;
            }
          }
          if (event.requestData.autoplay !== undefined) {
            autoplay = event.requestData.autoplay;
          }

          if (options.automaticVideoChange === false && !firstPlay) {
            // A video is already playing, but the user is changing to a new video
            // without an automatic video change configured
            // we need to let them set metadata first, and then have a play request get sent
            // so short circuit this block to stop events getting sent too early
            break;
          }

          // the user is expecting us to detect video changes
          if (options.automaticVideoChange && !firstPlay) {
            player.mux.emit('videochange', { video_title: title });
          }

          firstPlay = false;

          player.mux.emit('loadstart');
          player.mux.emit('play');
          break;
        case cast.framework.events.EventType.ENDED:
          player.mux.emit('ended');
          break;
        case cast.framework.events.EventType.MEDIA_STATUS:
          if (event.mediaStatus.videoInfo !== undefined) {
            // Note: it appears the videoInfo field is always undefined
            videoSourceWidth = event.mediaStatus.videoInfo.width;
            videoSourceHeight = event.mediaStatus.videoInfo.height;
          }
          if (event.mediaStatus.media !== undefined &&
            event.mediaStatus.media.duration !== undefined) {
            duration = mux.utils.secondsToMs(event.mediaStatus.media.duration);
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
          firstPlay = false;
          break;
        case cast.framework.events.EventType.ERROR:
          if (!options.automaticErrorTracking) { return; }
          switch (event.detailedErrorCode) {
            case 901:
            case 902:
              // specific errors to ads
              player.mux.emit('aderror');
              break;
            case 903:
            case 904:
              // do nothing since these aren't fatal errors
              break;
            default:
              player.mux.emit('error', {
                player_error_code: event.detailedErrorCode,
                player_error_message: event.error ? event.error.message : 'Unknown Error'
              });
              break;
          }
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

        case cast.framework.events.EventType.BREAK_STARTED:
          inAdBreak = true;
          player.mux.emit('adbreakstart');
          break;
      }
    }
  };
  player.addEventListener(cast.framework.events.category.CORE, player.muxListener);
  player.addEventListener(cast.framework.events.category.FINE, player.muxListener);
  player.addEventListener(cast.framework.events.category.DEBUG, player.muxListener);

  // Lastly, initialize the tracking
  mux.init(playerID, options);
  player.mux.emit('playerready');

  player.mux.destroy = function (player) {
    if (typeof player.muxListener !== 'undefined') {
      player.removeEventListener(cast.framework.events.category.CORE, player.muxListener);
      player.removeEventListener(cast.framework.events.category.FINE, player.muxListener);
      player.removeEventListener(cast.framework.events.category.DEBUG, player.muxListener);
      delete player.muxListener;
      player.mux.emit('destroy');
      player.mux.emit = function () {};
      player.mux.destroy = function () {};
    }
  };
};

export default monitorChromecastPlayer;
