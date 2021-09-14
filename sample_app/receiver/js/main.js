var app = {
  init: function () {
    const context = cast.framework.CastReceiverContext.getInstance();
    const playerManager = context.getPlayerManager();
    let firstPlay = true;
    let player_init_time = Date.now();

    playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, loadRequestData => {
      if (firstPlay) {
        firstPlay = false;
        initChromecastMux(playerManager, {
          debug: true,
          data: {
            env_key: 'YOUR_ENV_KEY',
            player_init_time: player_init_time,
            video_title: 'Chromecast Test Video'
          }
        });
      } else {
        playerManager.mux.emit('videochange', {
          video_title: 'Updated Video'
        });
      }

      return loadRequestData;
    });

    context.start();
  }
};

$(document).ready(function () {
  app.init();
});
