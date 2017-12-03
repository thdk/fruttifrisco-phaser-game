import * as Assets from '../assets';
import * as AssetUtils from '../utils/assetUtils';

export default class Preloader extends Phaser.State {
    private loadingAnimation: Phaser.Animation = null;

    public preload(): void {
        const loadingSprite = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, Assets.Spritesheets.SpritesheetsLoadingSprite12809608.getName());
        loadingSprite.anchor.setTo(0.5);

        this.loadingAnimation = loadingSprite.animations.add('load', null, 6, false).play();

        // add game assets
        // this.game.load.image(Assets.Images.ImagesBgGame.getName(), Assets.Images.ImagesBgGame.getPNG());
        // this.game.load.image(Assets.Images.ImagesBgCones.getName(), Assets.Images.ImagesBgCones.getPNG());
        this.game.load.physics(Assets.JSON.JsonSourcemachine.getName(), Assets.JSON.JsonSourcemachine.getJSON());
        this.game.load.spritesheet(Assets.Spritesheets.SpritesheetsMonster22530012.getName(), Assets.Spritesheets.SpritesheetsMonster22530012.getPNG(), Assets.Spritesheets.SpritesheetsMonster22530012.getFrameWidth(), Assets.Spritesheets.SpritesheetsMonster22530012.getFrameHeight(), 10);
        AssetUtils.Loader.loadAllAssets(this.game, this.waitForSoundDecoding, this);
    }

    private loadingAnimationComplete(): Phaser.Signal {
        const signal = new Phaser.Signal();
        signal.addOnce(() => this.startGame());
        return signal;
    }

    private waitForSoundDecoding(): void {
        AssetUtils.Loader.waitForSoundDecoding(this.soundDecoded, this);
    }

    private soundDecoded(): void {
        if (!this.loadingAnimation.isFinished)
            this.loadingAnimation.onComplete = this.loadingAnimationComplete();
        else
            this.startGame();
    }

    private startGame(): void {
        this.game.camera.onFadeComplete.addOnce(this.loadTitle, this);
        this.game.camera.fade(0x000000, 1000);
    }

    private loadTitle(): void {
        this.game.state.start('title');
    }
}
