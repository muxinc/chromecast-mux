var app = {
  init: function () {
    const context = cast.framework.CastReceiverContext.getInstance();
    const playerManager = context.getPlayerManager();

    initChromecastMux(playerManager, {
      debug: true,
      // automaticVideoChange: true,
      data: {
        env_key: 'ikh9lsia6bh8pj5get2vnt6hm',
        player_init_time: Date.now(),
        video_title: 'ChromeCast Test Video',
        experiment_name: 'Updated Source URL detection'
      }
    });

    context.start();
  }
};

$(document).ready(function () {
  app.init();
});