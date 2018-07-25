var app = {
  init: function () {
    const context = cast.framework.CastReceiverContext.getInstance();
    const playerManager = context.getPlayerManager();

    chromecastMux.monitorChromecastPlayer(playerManager, {
      debug: true,
      data : {
        env_key: 'hrca1hhidk4je5lbtcvjsj4sm',
        player_init_time: Date.now(),
      }
    });

    context.start();
  }
};

$(document).ready(function () {
  app.init();
});
