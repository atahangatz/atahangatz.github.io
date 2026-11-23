/* Duck Initiative — where to find us. Shown in the right-hand drawer and in the footer.
   Each entry: id (picks the icon), label, url, and an optional note shown beside the name.
   An entry with an empty url shows as "soon" and cannot be clicked.
   Shops are from the Waddle market list of 22 November 2026. Entries marked home: true point at the
   marketplace's front page because our profile address there is not confirmed yet; replace the url with
   the profile address when it is, and delete home: true.
   Icons available: instagram, x, reddit, vimeo, gumroad, superhive, unity, turbosquid, itch.
   Any other id shows its "mono" letters instead. */
var DUCK_LINKS = {
  social: [
    { id: 'vimeo',     label: 'Vimeo', url: 'https://vimeo.com/duckinitiative' },
    { id: 'instagram', label: 'Instagram', url: '' },
    { id: 'x',         label: 'X', url: '' },
    { id: 'reddit',    label: 'Reddit', url: '' }
  ],
  shops: [
    { id: 'gumroad',    label: 'Gumroad', url: 'https://waddlebyduck.gumroad.com' },
    { id: 'superhive',  label: 'Superhive', url: 'https://superhivemarket.com/creators/waddlebyduck' },
    { id: 'fab',        label: 'Fab', mono: 'Fab', url: 'https://www.fab.com/sellers/Waddle%20by%20Duck%20Initiative' },
    { id: 'unity',      label: 'Unity Asset Store', url: 'https://assetstore.unity.com/', home: true },
    { id: 'cgtrader',   label: 'CGTrader', mono: 'CG', url: 'https://www.cgtrader.com/designers/waddlebyduck' },
    { id: 'turbosquid', label: 'TurboSquid', url: 'https://www.turbosquid.com/', home: true },
    { id: '3dexport',   label: '3DExport', mono: '3D', url: 'https://3dexport.com/', home: true },
    { id: 'itch',       label: 'itch.io', url: 'https://waddlebyduck.itch.io/' }
  ]
};
