import { headerCase, lowerCase, pascalCase, sentenceCase } from "change-case";
import gulp from "gulp";
import filenames from "gulp-filenames";
import gulpLoadPlugins from "gulp-load-plugins";
import path from "path";

const $ = gulpLoadPlugins({});

const PREFIX = "Icon";
const CLASSNAME = "open-iconic";
const DIST_FOLDER = "dist";
const LIB_FOLDER = "lib";
const SRC_FOLDER = "node_modules/open-iconic/svg";
let fileList = [];
function cap(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

gulp.task("svg", () =>
  gulp
    .src(`${SRC_FOLDER}/**/*.svg`)
    .pipe(filenames("svg"))
    .pipe(
      $.svgmin(() => ({
        plugins: [
          { removeDoctype: true },
          { addAttributesToSVGElement: { attribute: "classNameString" } },
          { removeTitle: true },
          { removeStyleElement: true },
          {
            removeAttrs: {
              attrs: ["id", "class", "data-name", "fill", "xmlns"]
            }
          },
          { removeEmptyContainers: true },
          { sortAttrs: true },
          { removeUselessDefs: true },
          { removeEmptyText: true },
          { removeEditorsNSData: true },
          { removeEmptyAttrs: true },
          { removeHiddenElems: true },
          { collapseGroups: false }
        ]
      }))
    )

    .pipe(
      $.insert.transform((content, file) => {
        const filename = path.basename(file.relative, path.extname(file.relative));
        const name = pascalCase(filename);
        const alt = sentenceCase(filename)

        fileList = filenames.get("svg");

        return `
          import React from "react";
          export default function ${name}${PREFIX}({ alt = "${alt}", ...props }) {
            return (
              ${content}
            );
          }
        `;
      })
    )
    .pipe(
      $.rename(file => {
        file.basename = `${pascalCase(file.basename)}${PREFIX}`;
        file.extname = ".js";
      })
    )
    .pipe(gulp.dest(DIST_FOLDER))
);

gulp.task("replace", () =>
  gulp.src(`${DIST_FOLDER}/*.js`).pipe(
    $.tap(file => {
      const fileName = path.basename(file.path);
      const className = lowerCase(headerCase(fileName.replace(".js", "")));

      return gulp
        .src(`${DIST_FOLDER}/${fileName}`)
        .pipe(
          $.replace(
            "classNameString",
            `{...props} className={\`${CLASSNAME} ${CLASSNAME}-${className} \${props.className\}\`}`
          )
        )
        .pipe($.replace(/xmlns:xlink=".+?"/g, ``))
        .pipe($.replace(/xlink:href=".+?"/g, ``))
        .pipe($.replace("fill-rule=", "fillRule="))
        .pipe($.replace("fill-opacity=", "fillOpacity="))
        .pipe($.replace(/<svg([^>]*?)>/, '<svg $1>\n\t{alt && <title>{alt}</title>}'))
        .pipe($.prettier())
        .pipe(gulp.dest(DIST_FOLDER))
        .pipe(gulp.dest(LIB_FOLDER));
    })
  )
);

gulp.task("generateIndex", () =>
  gulp
    .src("./index.js")
    .pipe(
      $.insert.transform(function(contents, file) {
        let text = "";

        fileList.map(e => {
          let fileName = pascalCase(cap(e.replace(/\.svg$/gm, "")));
          text += `import ${fileName}${PREFIX} from './dist/${fileName}${PREFIX}';\n`;
        });

        let footer = "export {\n";

        fileList.map(e => {
          let fileName = pascalCase(cap(e.replace(/\.svg$/gm, "")));
          footer += `    ${fileName}${PREFIX},\n`;
        });

        return text + "\n" + footer + "};";
      })
    )
    .pipe(gulp.dest("./"))
);

gulp.task("default", gulp.series("svg", "replace", "generateIndex"));
