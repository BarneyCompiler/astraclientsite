import re

# Fix index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove delay modal
delay_regex = r'<!-- Delay Announcement Modal -->.*?</div>\s*</div>\s*</div>'
html = re.sub(delay_regex, '', html, flags=re.DOTALL)

# 2. Replace TBD with June 15
html = html.replace('TBD', 'June 15')
html = html.replace('Beta Live Now - Official Release Date June 15', 'Beta Live Now - Official Release Date June 15')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# Fix preview.js
with open('preview.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Remove fallback schematic appends
# Let's just find the fallback preset appends and remove them.
# The code is:
#             // Fallback presets matching your community styling
#             appendSchematicCard({
#                 name: "Titanic Hull (Unfinished)", ...

presets_regex = r'// Fallback presets matching your community styling[\s\S]*?(?=\}\);$)'
# Wait, it's safer to just remove the lines using string replacement or regex
# Let's replace the whole DOMContentLoaded content
old_dom = """        // Initialize the Schematic Grid with Preloads on load
        window.addEventListener('DOMContentLoaded', () => {
            // Render the "Small House" schematic card immediately with safe generated thumbnail
            compilePresetThumbnail(rawSmallHouseAschem, (smallHouseThumb) => {
                const smallHouseBlob = new Blob(["ASTRA_SCHEM_V1\\n" + JSON.stringify(rawSmallHouseAschem)], { type: "text/plain" });
                const smallHouseUrl = URL.createObjectURL(smallHouseBlob);

                appendSchematicCard({
                    name: "Cozy Cabin",
                    author: "BarneyTheGod",
                    blocks: rawSmallHouseAschem.blocks.filter(b => b !== 0).length,
                    downloadUrl: smallHouseUrl,
                    imgSrc: smallHouseThumb,
                    fileName: "cozy_cabin.aschem"
                });
            });

            // Fallback presets matching your community styling
            appendSchematicCard({
                name: "Titanic Hull (Unfinished)",
                author: "lax1dude",
                blocks: 34102,
                downloadUrl: "#",
                imgSrc: "image2.png", // Stand-in image
                fileName: "titanic_hull.aschem"
            });

            appendSchematicCard({
                name: "Castle Watchtower",
                author: "MinecraftPRO",
                blocks: 4890,
                downloadUrl: "#",
                imgSrc: "image3.png", // Stand-in image
                fileName: "castle_watchtower.aschem"
            });
        });"""

new_dom = """        // Initialize the Schematic Grid with Preloads on load
        window.addEventListener('DOMContentLoaded', () => {
            // Load live schematics from your backend here in the future
        });"""

if old_dom in js:
    js = js.replace(old_dom, new_dom)
else:
    print("Could not find exact dom content to replace")

with open('preview.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Fixes applied.")
