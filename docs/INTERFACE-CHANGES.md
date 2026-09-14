# Interface update 0.2.1

## Map title and field cleanup 0.2.4

Park titles use a smaller font and wrap within the map sidebar so names such as The Rustyard remain fully visible. Removed the added home plate and pitching rubber overlays; the stadium background and player positions are unchanged.

## Field correction 0.2.3

The stadium fills the battle screen without a capped central rectangle. The artwork, home plate, pitching rubber and player positions share the same full-screen coordinates. Home plate is in the wide left dirt patch, with the batter beside it, opposite the mound. All ground positions mirror together on defense. Narrow windows use a taller scrolling layout and keep the outcome text clear of player labels.

## Map correction 0.2.2

The first map now expands the entire act into individual game and stop nodes. It uses the same layout before the first game and between games, with all rest sites, training, shops, events, and conditional third games visible from the start. Completed stop choices remain marked across series. A 2–0 series routes around the third game. Only reachable nodes are selectable.

Games 2 and 3 unlock as route nodes after a between-game stop. Rest, training, shop and event choices branch and rejoin on the series map. Completing a series and its stop returns to the opponent route. Current v2 saves remain compatible.

The scoreboard uses opponent team names. Hands and combat piles show only the active card face; full decks and rewards show both. Cards support pointer drag-to-play with cancelled-drop handling and the existing click/keyboard controls.

Field artwork and sprite ground anchors share one proportional layout. The home plate and pitching rubber stay aligned through resizing. At a half change, the field mirrors and the player remains left. Reduced-motion settings skip animation.

Pitch strength and pitcher adjustment now have clearer labels; numeric/effect text uses a readable font. See the terminology README. Card values and combat balance are unchanged by this update.
