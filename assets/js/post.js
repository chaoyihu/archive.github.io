// insert table of contents
document.addEventListener("DOMContentLoaded", function() {
  var tocContainer = document.getElementById("toc-sidebar");

  var tocList = document.createElement("ul");
  tocList.id = "toc-list";

  var headings = document.querySelectorAll("h1:not(.post-title), h2, h3");
  var currentIndentLevel = 0;
  headings.forEach(function(heading) {
    var tocItem = document.createElement("li");
    var tocLink = document.createElement("a");
    tocLink.textContent = heading.textContent;
    tocLink.href = "#" + heading.id;
    // Adjust indentation based on heading level
    var headingLevel = parseInt(heading.tagName.substring(1));
    tocItem.style["margin-left"] = (20 * (headingLevel - 1)).toString() + 'px';
    tocItem.style["font-size"] = (16 - (headingLevel - 1)).toString() + 'px';

    tocItem.appendChild(tocLink);
    tocList.appendChild(tocItem);
    tocContainer.appendChild(tocList);
  });  
});