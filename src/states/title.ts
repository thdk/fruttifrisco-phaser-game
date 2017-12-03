import * as Assets from '../assets';

export default class Title extends Phaser.State {
    private backgroundTemplateSprite: Phaser.Sprite = null;
    private googleFontText: Phaser.Text = null;
    private sfxAudiosprite: Phaser.AudioSprite = null;

    // This is any[] not string[] due to a limitation in TypeScript at the moment;
    // despite string enums working just fine, they are not officially supported so we trick the compiler into letting us do it anyway.
    private sfxLaserSounds: any[] = null;

    public create(): void {
        this.backgroundTemplateSprite = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, Assets.Images.ImagesBgCones.getName());
        this.backgroundTemplateSprite.scale.setTo(0.5);
        this.backgroundTemplateSprite.anchor.setTo(0.5);

        this.googleFontText = this.game.add.text(this.game.world.centerX, this.game.world.centerY - 100, 'Frutti Frisco', {
            font: '50px ' + Assets.GoogleWebFonts.Barrio,
            fill: 'white'
        });
        this.googleFontText.anchor.setTo(0.5);

        this.sfxAudiosprite = this.game.add.audioSprite(Assets.Audiosprites.AudiospritesSfx.getName());

        // This is an example of how you can lessen the verbosity
        let availableSFX = Assets.Audiosprites.AudiospritesSfx.Sprites;
        this.sfxLaserSounds = [
            availableSFX.Laser1,
            availableSFX.Laser2,
            availableSFX.Laser3,
            availableSFX.Laser4,
            availableSFX.Laser5,
            availableSFX.Laser6,
            availableSFX.Laser7,
            availableSFX.Laser8,
            availableSFX.Laser9
        ];

        this.game.sound.play(Assets.Audio.AudioMusic.getName(), 0.2, true);

        this.backgroundTemplateSprite.inputEnabled = true;
        this.backgroundTemplateSprite.events.onInputDown.add(() => {
            this.sfxAudiosprite.play(Phaser.ArrayUtils.getRandomItem(this.sfxLaserSounds));
        });

        const spacebar = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        spacebar.onDown.add(this.goToGame, this);

        this.game.camera.flash(0x000000, 1000);
    }

    private goToGame() {
        this.game.state.start('game');
    }
}
