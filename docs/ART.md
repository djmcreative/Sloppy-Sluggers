# Art and presentation

All 32 PNG files in `dist/assets/art/originals/` are unchanged copies of the supplied art archive. These are ordinary files and can be imported into an image editor or game engine.

## Custom player characters

`dist/assets/art/characters/` contains six separate transparent PNG exports: a batting stance and a selection portrait for Dean Kean, The Captain, and The Speedster. They were generated with OpenAI ImageGen using the owner's supplied photographs and baseball pixel-art references. All three wear solid yellow jerseys with red collar and sleeve trim, without red stripes. The photographs themselves are not included in the project.

These are full-resolution, flattened RGBA exports, ready to import into an image editor or game engine. They use a pixel illustration style; they are not native low-resolution sprite sheets or layered Piskel projects. Exact dimensions and alpha-channel inspection results are recorded in `character-assets.json`. Generation and correction prompts are preserved in `character-art-prompts/`.

The original ZIP's `piskel files` folder was empty. Editable Piskel projects, layer data, and animation frames were not supplied and have not been invented. The PNGs remain flattened raster images, with their original transparency and dimensions.

`dist/js/data/assets.js` resolves artwork names and maps the player characters to their custom PNGs. `dist/js/data/card-art.js` assigns character illustrations to cards; remaining cards use equipment and action icons. Change an entry to replace one card's artwork. Card borders, cost badges, type labels, and descriptions are rendered separately, so none of that text is baked into a PNG.

Pixelify Sans is distributed locally under the SIL Open Font License. Its font and license are in `dist/assets/fonts/`. Source: [Google Fonts / Pixelify Sans](https://github.com/google/fonts/tree/main/ofl/pixelifysans).

## Visual direction

The final presentation uses a full-screen stadium, a compact floating HUD, large pixel sprites, physical overlapping cards, a simple title menu, and a connected scouting map. The night palette uses blue shadows, cream paper, orange-red controls, and warm scoreboard lights. It replaces the first draft's editorial header, slogan panels, and boxed matchup grid.

The owner's requested visual references are [Slay the Spire 2](https://store.steampowered.com/app/2868840/Slay_the_Spire_2/), [Balatro](https://store.steampowered.com/app/2379780/Balatro/), and [Monster Train 2](https://store.steampowered.com/app/2742830/Monster_Train_2/). No artwork, logos, or source code from those games is included.

## Further art work

- Replace shared illustrations with individual native-resolution card pictures.
- Add dedicated pitcher windup, pitch, batter swing, and celebration frames.
- Create distinct backgrounds for later acts while retaining one pixel grid and palette discipline.
- Review new assets beside the original set before integrating them.

The live layout keeps typography, borders, art, and animations separate, allowing manual art refinement without rewriting the rules.
