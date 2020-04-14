var app = {
  init: function () {
    const context = cast.framework.CastReceiverContext.getInstance();
    const playerManager = context.getPlayerManager();

    initChromecastMux(playerManager, {
      debug: true,
      automaticVideoChange: true,
      data: {
        env_key: 'ikh9lsia6bh8pj5get2vnt6hm', // JW Testing
        player_init_time: Date.now(),
        experiment_name: 'automaticVideoChange enabled'
      }
    });

    context.start();
  }
};

$(document).ready(function () {
  app.init();
});