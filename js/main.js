var app = {
    init: function () {
        cast.framework.CastReceiverContext.getInstance().start();

        document.addEventListener('keydown', function (event) {
            switch(this.getKeyCode(event)) {
                case app.KEY_LEFT:
                    if (this.currentBtnIndex > 0)
                        this.currentBtnIndex--;
                    break;
                case app.KEY_RIGHT:
                    if (this.currentBtnIndex < 6)
                        this.currentBtnIndex++;
                    break;
                case app.KEY_OK:
                    switch(this.currentBtnIndex) {
                        case 0:
                            break;
                        case 1:
                            break;
                        case 2:
                            break;
                        case 3:
                            break;
                        case 4:
                            break;
                        case 5:
                            break;
                    }
                    break;
                default:
                    break;
            }
            switch(this.currentBtnIndex) {
                case 0:
                    $('#btnPlay').focus();
                    break;
                case 1:
                    $('#btnStop').focus();
                    break;
                case 2:
                    $('#btnPause').focus();
                    break;
                case 3:
                    $('#btnResume').focus();
                    break;
                case 4:
                    $('#btnRewind').focus();
                    break;
                case 5:
                    $('#btnForward').focus();
                default:
                    break;
            }
            event.preventDefault();
            return true;
        }.bind(this));
        this.currentBtnIndex = 0;
        $('#btnPlay').focus();
    },

    getKeyCode: function(event) {
        switch (event.keyCode) {
            case 40:
                return app.KEY_DOWN;
            case 37:
                return app.KEY_LEFT;
            case 39:
                return app.KEY_RIGHT;
            case 38:
                return app.KEY_UP;
            case 13:
                return app.KEY_OK;
            case 8:
            case 27:
            case 10009:
                return app.KEY_BACK;
            case 412:
                return app.KEY_REWIND;
            case 19:
                return app.KEY_PAUSE;
            case 417:
                return app.KEY_FORWARD;
            case 415:
                return app.KEY_PLAY;
            case 413:
                return app.KEY_STOP;
            default:
                return app.KEY_UNKNOWN;
        }
    },
};

$(document).ready(function () {
    app.KEY_UNKNOWN = -1;
    app.KEY_OK = 0;
    app.KEY_INFO = 1;
    app.KEY_UP = 2;
    app.KEY_DOWN = 3;
    app.KEY_LEFT = 4;
    app.KEY_RIGHT = 5;
    app.KEY_REWIND = 6;
    app.KEY_FORWARD = 7;
    app.KEY_MENU = 8;
    app.KEY_PLAY = 9;
    app.KEY_PAUSE = 10;
    app.KEY_BACK = 11;
    app.KEY_STOP = 12;

    app.init();
});
