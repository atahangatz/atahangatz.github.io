# duckinitiative.com

The Duck Initiative homepage, served by GitHub Pages at https://duckinitiative.com/. Plain HTML and CSS with no build step: edit a file, commit to `main`, and the site updates a minute or two later.

Polygraph's guide at `/polygraph/` comes from its own repository and isn't in this one, so nothing here can break it.

## Files

- `index.html`: the homepage. The styles and the little script are inside it.
- `404.html`: shown for any address that doesn't exist.
- `newsletter/check-email/` and `newsletter/confirmed/`: where Buttondown sends people after they sign up, and after they click the link in the confirmation email.
- `fonts/`: Besley and IBM Plex, served from this site so no page loads anything from Google. `fonts/OFL.txt` is their licence.
- `img/`: the duck (still, phone version, paddling loop and a small badge), the link preview image (`og.jpg`) and the app icons.
- `CNAME`: keeps the custom domain. Don't delete it.
- `.nojekyll`: tells GitHub Pages to serve the files as they are.

## Launch day

The homepage switches its "comes out on December 8" lines to "out now" by itself on December 8, 2026 (Istanbul time). Nothing needs changing that day.

## Newsletter

The sign-up form posts to Buttondown, newsletter `duckinitiative`. If the newsletter ever gets another username, change the end of the form's `action` address in `index.html` to match. Buttondown's redirect settings (Settings → Subscribing) point at the two `newsletter/` pages above.
