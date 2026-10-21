import { htmlToText } from "../../src/utils/html.js";

describe("htmlToText", () => {
  it("drops the head and tags and keeps paragraphs on separate lines", () => {
    const html = `<!DOCTYPE html><html><head><title>Ignored</title></head><body>
      <h2 class="mowca">Marszałek:</h2>
      <p>    Otwieram   posiedzenie.</p><p>Druga<br/>linia</p>
    </body></html>`;

    expect(htmlToText(html)).toBe("Marszałek:\n\nOtwieram posiedzenie.\nDruga\nlinia");
  });

  it("decodes named and numeric entities", () => {
    expect(htmlToText("<p>A&nbsp;&amp;&nbsp;B &lt;C&gt; &#211;&#x141; &quot;x&quot; &bogus;</p>")).toBe(
      'A & B <C> ÓŁ "x" &bogus;'
    );
  });

  it("renders list items as bullet points", () => {
    expect(htmlToText("<ol><li>Pierwszy</li><li>Drugi</li></ol>")).toBe("- Pierwszy\n- Drugi");
  });

  it("removes scripts and styles", () => {
    expect(htmlToText("<style>p{}</style><script>alert(1)</script><p>Tekst</p>")).toBe("Tekst");
  });
});
