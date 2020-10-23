"use strict";

const fs = require("fs");
var glob = require("glob-promise");
const { v4: uuid } = require("uuid");
const { extract, parse } = require("jest-docblock");

/**
 * Parses and returns the docblock pragma data from a specified file
 *
 * @param {string} filePath The path of the file to parse the data from
 */
exports.loadDocblockPragmas = (filePath) => {
  const fileContents = fs.readFileSync(filePath).toString();
  return parse(extract(fileContents));
};

/**
 * Given the docblock pragmas from the experiment file, extracts the specified image, audio, and
 * video directories and returns an object containing the respective paths.
 */
exports.getAssetDirectories = (pragmas) => {
  const assetDirectories = {};

  [
    ["images", pragmas.imageDir],
    ["audio", pragmas.audioDir],
    ["video", pragmas.videoDir],
    ["misc", pragmas.miscDir],
  ].map(([assetType, assetDirsString]) => {
    assetDirectories[assetType] =
      typeof assetDirsString == "undefined"
        ? []
        : assetDirsString.split(",").map((dir) => "media/" + dir);
  });

  return assetDirectories;
};

/**
 * Given the object returned by `getAssetDirectories()`, reads the specified directories recursively
 * and returns an object containing the respective file paths.
 */
exports.getAssetPaths = async (assetDirectories) => {
  const resolvePaths = async (directories) => {
    const paths = [];
    await Promise.all(
      directories.map(async (dir) => {
        paths.concat(await glob(dir + "/**/*", { nodir: true }));
      })
    );
    return paths;
  };

  const assetPaths = {};
  await Promise.all(
    Object.entries(assetDirectories).map(async ([assetType, assetDirs]) => {
      assetPaths[assetType] = typeof assetDirs == "undefined" ? [] : await resolvePaths(assetDirs);
    })
  );
  return assetPaths;
};

exports.getJatosStudyMetadata = (slug, title, description, version) => {
  let study = {
    version: "3",
    data: {
      uuid: uuid(),
      title: `${title} (${version})`,
      description,
      groupStudy: false,
      linearStudy: false,
      dirName: `${slug}_${version}`,
      comments: "",
      jsonData: null,
      endRedirectUrl: null,
      componentList: [
        {
          uuid: uuid(),
          title: "jsPsych timeline",
          htmlFilePath: "index.html",
          reloadable: true,
          active: true,
          comments: "",
          jsonData: null,
        },
      ],
      batchList: [
        {
          uuid: uuid(),
          title: "Default",
          active: true,
          maxActiveMembers: null,
          maxTotalMembers: null,
          maxTotalWorkers: null,
          allowedWorkerTypes: null,
          comments: null,
          jsonData: null,
        },
      ],
    },
  };
  return study;
};
