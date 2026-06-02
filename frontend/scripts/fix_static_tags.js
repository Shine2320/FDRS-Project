// scripts/fix_static_tags.js
import fs from "fs";

const indexPath = "../server/user/static/index.html";
let content = fs.readFileSync(indexPath, "utf-8");

if (!content.includes("{% load static %}")) {
  content = `{% load static %}\n` + content;
}

content = content.replace(
  /href="\/?assets\/(.*?)"/g,
  'href="{% static \'assets/$1\' %}"'
);
content = content.replace(
  /src="\/?assets\/(.*?)"/g,
  'src="{% static \'assets/$1\' %}"'
);

fs.writeFileSync(indexPath, content, "utf-8");
console.log("Static asset paths converted to Django static tags.");
