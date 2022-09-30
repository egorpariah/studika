import gulp from "gulp";
const { src, dest, task, series, watch, parallel } = gulp;
import { deleteAsync as del } from "del";
import dartSass from "sass";
import gulpSass from "gulp-sass";
const sass = gulpSass(dartSass);
import concat from "gulp-concat";
import { create as browserSyncCreate } from "browser-sync";
const browserSync = browserSyncCreate();
const stream = browserSync.stream;
const reload = browserSync.reload;
import sassGlob from "gulp-sass-glob";
import autoprefixer from "gulp-autoprefixer";
import gcmq from "gulp-group-css-media-queries";
import cleanCSS from "gulp-clean-css";
import sourcemaps from "gulp-sourcemaps";
import { rollup } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonJS from "@rollup/plugin-commonjs";
import { getBabelOutputPlugin as babel } from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import imagemin from "gulp-imagemin";
import svgmin from "gulp-svgmin";
import svgSprite from "gulp-svg-sprite";
import gulpif from "gulp-if";
import ghPages from "gulp-gh-pages";

const env = process.env.NODE_ENV;

import { SRC_PATH, DIST_PATH, STYLES_LIBS } from "./gulp.config.js";

task("clean", () => {
  return del(`${DIST_PATH}/**/*`);
});

task("copy:html", () => {
  return src(`${SRC_PATH}/*.html`)
    .pipe(dest(`${DIST_PATH}`))
    .pipe(reload({ stream: true }));
});

task("copy:images", () => {
  return src([`${SRC_PATH}/images/*`, `!${SRC_PATH}/images/svg`])
    .pipe(gulpif(env === "prod", imagemin()))
    .pipe(dest(`${DIST_PATH}/template/images`));
});

task("svg", () => {
  return src(`${SRC_PATH}/images/svg/*.svg`)
    .pipe(
      svgmin({
        full: true,
        plugins: [
          {
            name: "removeDimensions",
          },
          {
            name: "removeViewBox",
            active: false,
          },
          {
            name: "removeAttrs",
            params: {
              attrs: "(fill|stroke|style|data-*)",
            },
          },
        ],
      })
    )
    .pipe(
      svgSprite({
        mode: {
          view: {
            sprite: "../sprite.view.svg",
            bust: false,
          },
          symbol: {
            sprite: "../sprite.svg",
            inline: true,
          },
        },
      })
    )
    .pipe(dest(`${DIST_PATH}/template/images`));
});

task("styles", () => {
  return src([...STYLES_LIBS, "src/scss/main.scss"])
    .pipe(gulpif(env === "dev", sourcemaps.init()))
    .pipe(concat("styles.min.scss"))
    .pipe(sassGlob())
    .pipe(sass().on("error", sass.logError))
    .pipe(
      gulpif(
        env === "prod",
        autoprefixer({
          cascade: false,
        })
      )
    )
    .pipe(gulpif(env === "prod", gcmq()))
    .pipe(gulpif(env === "prod", cleanCSS()))
    .pipe(gulpif(env === "dev", sourcemaps.write()))
    .pipe(dest(`${DIST_PATH}/template/css`))
    .pipe(stream());
});

task("scripts", () => {
  return rollup({
    input: "src/js/index.js",
    plugins: [
      nodeResolve({
        mainFields: ["browser", "jsnext:main", "module", "main"],
      }),
      commonJS(),
    ],
  })
    .then((bundle) => {
      return bundle.write({
        file: "./dist/template/js/scripts.min.js",
        format: "esm",
        sourcemap: env === "dev" && "inline",
        plugins: [
          env === "prod" &&
            (babel({
              presets: ["@babel/preset-env"],
            }),
            terser()),
        ],
      });
    })
    .then(reload());
});

task("server", () => {
  browserSync.init({
    server: {
      baseDir: `${DIST_PATH}`,
    },
    open: false,
  });
});

task("watch", () => {
  watch(`${SRC_PATH}/*.html`, series("copy:html"));
  watch(`${SRC_PATH}/images/*`, series("copy:images"));
  watch(`${SRC_PATH}/images/svg/*.svg`, series("svg"));
  watch(`${SRC_PATH}/scss/**/*.scss`, series("styles"));
  watch(`${SRC_PATH}/js/**/*.js`, series("scripts"));
});

task("deploy", () => {
  return src(`${DIST_PATH}/**/*`).pipe(ghPages({ cacheDir: "dist" }));
});

task(
  "default",
  series(
    "clean",
    parallel("copy:html", "copy:images", "svg", "styles", "scripts"),
    parallel("watch", "server")
  )
);

task(
  "build",
  series(
    "clean",
    parallel("copy:html", "copy:images", "svg", "styles", "scripts")
  )
);
