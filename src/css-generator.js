const { marginL, marginR, maxWidth, borderR, borderL, contentBox, minFullHeight, autoHeight, lengthProps } = require("./constants");
const {
  convertPropValue,
  hasIgnoreComments,
  round,
  dynamicZero,
} = require("./logic-helper");
const { varTestReg } = require("./regexs");

function appendDemoContent(postcss, selector, rule, desktopViewAtRule, landScapeViewAtRule, disableDesktop, disableLandscape, disableMobile) {
  if (!disableMobile) {
    rule.append({
      prop: "content",
      value: "'✨Portrait✨'",
    });
  }
  if (!disableDesktop) {
    desktopViewAtRule.append(postcss.rule({ selector }).append({
      prop: "content",
      value: "'✨Desktop✨'",
    }));
  }
  if (!disableLandscape) {
    landScapeViewAtRule.append(postcss.rule({ selector }).append({
      prop: "content",
      value: "'✨Landscape✨'",
    }));
  }
}

/** 限制百分比的最大宽度 */
function percentageToMaxViewUnit(number, maxDisplayWidth, numberStr, unitPrecision) {
  const maxN = round(maxDisplayWidth * number / 100, unitPrecision);
  if (number > 0) return `min(${numberStr}%, ${maxN}px)`;
  else if (number < 0) return `max(${numberStr}%, ${maxN}px)`;
  else return "0%";
}

/** vw 限制最大宽度 */
function vwToMaxViewUnit(number, maxDisplayWidth, numberStr, unitPrecision) {
  const maxN = round(maxDisplayWidth * number / 100, unitPrecision);
  if (number > 0) return `min(${numberStr}vw, ${maxN}px)`;
  else if (number < 0) return `max(${numberStr}vw, ${maxN}px)`;
  else return "0vw";
}

/** px 转为视口单位（限制最大宽度） */
function pxToMaxViewUnit(number, maxDisplayWidth, viewportWidth, unitPrecision, viewportUnit, fontViewportUnit, prop) {
  const fontProp = prop.includes("font");
  const n = round(number * 100 / viewportWidth, unitPrecision);
  const mobileUnit = fontProp ? fontViewportUnit : viewportUnit;
  const maxN = round(number * maxDisplayWidth / viewportWidth, unitPrecision);
  if (number > 0) return `min(${n}${mobileUnit}, ${maxN}px)`;
  else if (number < 0) return `max(${n}${mobileUnit}, ${maxN}px)`;
  else return `0px`;
}

/** px 转为视口单位 */
function pxToViewUnit(prop, number, unit, viewportWidth, unitPrecision, fontViewportUnit, viewportUnit) {
  const fontProp = prop.includes("font");
  const n = round(number * 100 / viewportWidth, unitPrecision);
  const mobileUnit = fontProp ? fontViewportUnit : viewportUnit;
  return number === 0 ? `0${unit}` : `${n}${mobileUnit}`;
}

/** 以根元素为包含块的 left、right 属性的 px 值转换 */
function pxToMaxViewUnit_FIXED_LR(number, maxDisplayWidth, viewportWidth, unitPrecision) {
  const maxNRadio = maxDisplayWidth / viewportWidth;
  const calc = 50 - round(number * 100 / viewportWidth, unitPrecision);
  const calc2 = round(maxDisplayWidth / 2 - number * maxNRadio, unitPrecision)
  if (number > maxDisplayWidth / 2)
    return `calc(50% - max(${calc2}px, ${calc}%))`;
  else return `calc(50% - min(${calc2}px, ${calc}%))`;
}

/** 以根元素为包含块的 left、right 属性的 vw 值转换 */
function vwToMaxViewUnit_FIXED_LR(number, maxDisplayWidth, unitPrecision) {
  const calc = round(maxDisplayWidth * (50 - number) / 100, unitPrecision);
  const calc2 = 50 - number;
  if (number < 50) return `calc(50vw - min(${calc2}vw, ${calc}px))`;
  else return `calc(50vw - max(${calc2}vw, ${calc}px))`;
}

/** 以根元素为包含块的 left、right 属性的百分比 % 值转换 */
function percentToMaxViewUnit_FIXED_LR(number, maxDisplayWidth, unitPrecision) {
  const calc = round(maxDisplayWidth * (50 - number) / 100, unitPrecision);
  const calc2 = 50 - number;
  if (number < 50) return `calc(50% - min(${calc2}%, ${calc}px))`;
  else return `calc(50% - max(${calc2}%, ${calc}px))`;
}

/** px 转为媒体查询中的 px */
function pxToMediaQueryPx(number, viewportWidth, idealWidth, unitPrecision, numberStr) {
  const dznn = numberStr => number => dynamicZero(number, numberStr);
  const dzn = dznn(numberStr);
  const radio = idealWidth / viewportWidth;
  const n = round(number * radio, unitPrecision);
  return `${dzn(n)}px`;
}

/** 以根元素为包含块的 left、right 属性的 px 值转换 */
function pxToMediaQueryPx_FIXED_LR(number, viewportWidth, idealWidth, unitPrecision) {
  const radio = idealWidth / viewportWidth;
  const roundedCalc = round(idealWidth / 2 - number * radio, unitPrecision);
  return `calc(50% - ${roundedCalc}px)`;
}

/** 以根元素为包含块的 left、right 属性的 vw 值转换 */
function vwToMediaQueryPx_FIXED_LR(number, idealWidth, precision) {
  const roundedCalc = round(idealWidth / 2 - idealWidth * number / 100, precision);
  return `calc(50% - ${roundedCalc}px)`;
}

/** 以根元素为包含块的 left、right 属性的百分比 % 值转换 */
function percentToMediaQueryPx_FIXED_LR(number, idealWidth, precision) {
  const roundedCalc = round(idealWidth / 2 - idealWidth * number / 100, precision);
  return `calc(50% - ${roundedCalc}px)`;
}

/** 无单位的 0，以根元素为包含块，left、right 属性的转换 */
function noUnitZeroToMediaQueryPx_FIXED_LR(idealWidth) {
  return `calc(50% - ${idealWidth / 2}px)`;
}

/** vw 转为媒体查询中的 px */
function vwToMediaQueryPx(number, idealWidth, precision, numberStr) {
  const dznn = numberStr => number => dynamicZero(number, numberStr);
  const dzn = dznn(numberStr);
  return `${dzn(round(idealWidth / 100 * number, precision))}px`;
}

function percentToMediaQueryPx_FIXED(number, idealWidth, precision, numberStr) {
  const dznn = numberStr => number => dynamicZero(number, numberStr);
  const dzn = dznn(numberStr);
  return `${dzn(round(idealWidth / 100 * number, precision))}px`;
}

/** 转换受 fixed 影响的属性的媒体查询值 */
function appendConvertedFixedContainingBlockDecls(postcss, selector, decl, disableDesktop, disableLandscape, disableMobile, isFixed, {
  viewportWidth,
  desktopRadio,
  landscapeRadio,
  desktopViewAtRule,
  landScapeViewAtRule,
  sharedAtRult,
  unitPrecision,
  fontViewportUnit,
  replace,
  result,
  viewportUnit,
  desktopWidth,
  landscapeWidth,
  maxDisplayWidth,
}) {
  const prop = decl.prop;
  const val = decl.value;
  const important = decl.important;
  const leftOrRight = prop === "left" || prop === "right";
  const limitedWidth = maxDisplayWidth != null;
  appendMediaRadioPxOrReplaceMobileVwFromPx(postcss, selector, prop, val, disableDesktop, disableLandscape, disableMobile, {
    viewportWidth,
    desktopRadio,
    landscapeRadio,
    desktopViewAtRule,
    landScapeViewAtRule,
    sharedAtRult,
    important,
    decl,
    unitPrecision,
    fontViewportUnit,
    replace,
    result,
    viewportUnit,
    desktopWidth,
    landscapeWidth,
    matchPercentage: isFixed,
    convertMobile: (number, unit, numberStr) => {
      if (limitedWidth) {
        if (isFixed) {
          if (leftOrRight) {
            if (unit === "px") {
              return pxToMaxViewUnit_FIXED_LR(number, maxDisplayWidth, viewportWidth, unitPrecision);
            } else if (unit === "vw") {
              return vwToMaxViewUnit_FIXED_LR(number, maxDisplayWidth, unitPrecision);
            } else if (unit === '%') {
              return percentToMaxViewUnit_FIXED_LR(number, maxDisplayWidth, unitPrecision);
            } else if (unit === " " || unit === "") {
              if (number === 0)
                return `calc(50% - min(50%, ${maxDisplayWidth / 2}px))`;
              return `${number}${unit}`;
            } else return `${numberStr}${unit}`;
          } else {
            if (unit === "px") {
              return pxToMaxViewUnit(number, maxDisplayWidth, viewportWidth, unitPrecision, viewportUnit, fontViewportUnit, prop);
            } else if (unit === "vw") {
              return vwToMaxViewUnit(number, maxDisplayWidth, numberStr, unitPrecision);
            } else if (unit === "%") {
              return percentageToMaxViewUnit(number, maxDisplayWidth, numberStr, unitPrecision);
            } else return `${numberStr}${unit}`;
          }
        } else {
          if (unit === "px") {
            return pxToMaxViewUnit(number, maxDisplayWidth, viewportWidth, unitPrecision, viewportUnit, fontViewportUnit, prop);
          } else if (unit === "vw") {
            return vwToMaxViewUnit(number, maxDisplayWidth, numberStr, unitPrecision);
          } else return `${number}${unit}`;
        }
      }
      if (unit === "px") {
        return pxToViewUnit(prop, number, unit, viewportWidth, unitPrecision, fontViewportUnit, viewportUnit);
      } else
        return `${number}${unit}`
    },
    convertDesktop: (number, unit, numberStr) => {
      // 处理 0
      const dznn = numberStr => number => dynamicZero(number, numberStr);
      const dzn = dznn(numberStr);
      if (isFixed) {
        if (leftOrRight) {
          if (unit === "px") {
            return pxToMediaQueryPx_FIXED_LR(number, viewportWidth, desktopWidth, unitPrecision);
          } else if (unit === "vw") {
            return vwToMediaQueryPx_FIXED_LR(number, desktopWidth, unitPrecision);
          } else if (unit === '%') {
            return percentToMediaQueryPx_FIXED_LR(number, desktopWidth, unitPrecision);
          } else if (unit === "" || unit === " ") {
            if (number === 0)
              return noUnitZeroToMediaQueryPx_FIXED_LR(desktopWidth);
            return `${number}${unit}`;
          } else
            return `${number}${unit}`;
        } else {
          if (unit === "px") {
            return pxToMediaQueryPx(number, viewportWidth, desktopWidth, unitPrecision, numberStr);
          } else if (unit === '%') {
            return percentToMediaQueryPx_FIXED(number, desktopWidth, unitPrecision, numberStr);
          } else if (unit === "vw") {
            return vwToMediaQueryPx(number, desktopWidth, unitPrecision, numberStr);
          } else
            return `${dzn(number)}${unit}`;
        }
      } else {
        if (unit === "vw")
          return vwToMediaQueryPx(number, desktopWidth, unitPrecision);
        else if (unit === "px") {
          return pxToMediaQueryPx(number, viewportWidth, desktopWidth, unitPrecision, numberStr);
        } else
          return `${dzn(number)}${unit}`;
      }
    },
    convertLandscape: (number, unit, numberStr) => {
      // 处理 0
      const dznn = numberStr => number => dynamicZero(number, numberStr);
      const dzn = dznn(numberStr);
      if (isFixed) {
        if (leftOrRight) {
          if (unit === "px") {
            return pxToMediaQueryPx_FIXED_LR(number, viewportWidth, landscapeWidth, unitPrecision, numberStr);
          } else if (unit === '%') {
            return percentToMediaQueryPx_FIXED_LR(number, landscapeWidth, unitPrecision);
          } else if (unit === "vw") {
            return vwToMediaQueryPx_FIXED_LR(number, landscapeWidth, unitPrecision);
          } else if (unit === "" || unit === " ") {
            if (number === 0)
              return noUnitZeroToMediaQueryPx_FIXED_LR(landscapeWidth);
            return `${number}${unit}`;
          } else
            return `${number}${unit}`;
        } else {
          if (unit === "px") {
            return pxToMediaQueryPx(number, viewportWidth, landscapeWidth, unitPrecision, numberStr);
          } else if (unit === "vw") {
            return vwToMediaQueryPx(number, landscapeWidth, unitPrecision, numberStr);
          } else if (unit === '%') {
            return percentToMediaQueryPx_FIXED(number, landscapeWidth, unitPrecision, numberStr);
          } else
            return `${dzn(number)}${unit}`;
        }
      } else {
        if (unit === "vw")
          return vwToMediaQueryPx(number, landscapeWidth, unitPrecision);
        else if (unit === "px") {
          return pxToMediaQueryPx(number, viewportWidth, landscapeWidth, unitPrecision, numberStr);
        } else
          return `${dzn(number)}${unit}`;
      }
    },
  });
}

/** px 值，转换为媒体查询中比例计算的 px，替换为移动端竖屏视口单位 */
function appendMediaRadioPxOrReplaceMobileVwFromPx(postcss, selector, prop, val, disableDesktop, disableLandscape, disableMobile, {
  desktopViewAtRule,
  landScapeViewAtRule,
  sharedAtRult,
  important,
  decl,
  replace,
  result,
  convertLandscape,
  convertDesktop,
  convertMobile,
  desktopWidth,
  landscapeWidth,
  unitPrecision,
  matchPercentage,
}) {
  decl.book = true;

  const enabledDesktop = !disableDesktop;
  const enabledLandscape = !disableLandscape;
  const enabledMobile = !disableMobile;

  if (enabledDesktop || enabledLandscape || enabledMobile) {
    const { mobile, desktop, landscape } = convertPropValue(prop, val, {
      enabledMobile,
      enabledDesktop,
      enabledLandscape,
      convertMobile,
      convertDesktop,
      convertLandscape,
      desktopWidth,
      landscapeWidth,
      unitPrecision,
      matchPercentage,
    });

    if (enabledMobile) {
      if (replace)
        decl.value = mobile;
      else
        decl.after(decl.clone({ value: mobile, book: true, }));
    }
    if (enabledDesktop) {
      if (val !== desktop) {
        desktopViewAtRule.append(postcss.rule({ selector }).append({
          prop: prop, // 属性
          value: desktop, // 替换 px 比例计算后的值
          important, // 值的尾部有 important 则添加
        }));
      }
    }
    if (enabledLandscape) {
      if (val !== landscape) {
        landScapeViewAtRule.append(postcss.rule({ selector }).append({
          prop,
          value: landscape,
          important,
        }));
      }
    }

    let shouldAppendDesktopVar = false;
    let shouldAppendLandscape = false;
    if (enabledDesktop || enabledLandscape) {
      if (lengthProps.includes(prop)) {
        const tested = varTestReg.test(val);
        shouldAppendDesktopVar = tested && val === desktop;
        shouldAppendLandscape = tested && val === landscape;
      }
    }
    appendCSSVar(shouldAppendDesktopVar, shouldAppendLandscape, prop, val, important, selector, postcss, {
      sharedAtRult,
      desktopViewAtRule,
      landScapeViewAtRule,
    });
  }
}

function appendCSSVar(enabledDesktop, enabledLandscape, prop, val, important, selector, postcss, {
  sharedAtRult,
  desktopViewAtRule,
  landScapeViewAtRule,
}) {
  if (enabledDesktop && enabledLandscape) {
    sharedAtRult.append(postcss.rule({ selector }).append({
      prop: prop, // 属性
      value: val,
      important, // 值的尾部有 important 则添加
    }));
  } else if (enabledDesktop) {
    desktopViewAtRule.append(postcss.rule({ selector }).append({
      prop: prop, // 属性
      value: val,
      important, // 值的尾部有 important 则添加
    }));
  } else if (enabledLandscape) {
    landScapeViewAtRule.append(postcss.rule({ selector }).append({
      prop: prop, // 属性
      value: val,
      important, // 值的尾部有 important 则添加
    }));
  }
}

/** 居中最外层选择器，margin 居中，无 border */
function appendMarginCentreRootClassNoBorder(postcss, selector, disableDesktop, disableLandscape, {
  desktopViewAtRule,
  landScapeViewAtRule,
  sharedAtRult,
  desktopWidth,
  landscapeWidth
}) {
  if (disableDesktop && !disableLandscape) {
    // 仅移动端横屏
    landScapeViewAtRule.append(postcss.rule({ selector }).append(maxWidth(landscapeWidth), marginL, marginR));
  } else if (disableLandscape && !disableDesktop) {
    // 仅桌面
    desktopViewAtRule.append(postcss.rule({ selector }).append(maxWidth(desktopWidth), marginL, marginR));
  } else if (!disableDesktop && !disableLandscape) {
    // 桌面和移动端横屏
    desktopViewAtRule.append(postcss.rule({ selector }).append(maxWidth(desktopWidth)));
    landScapeViewAtRule.append(postcss.rule({ selector }).append(maxWidth(landscapeWidth)));
    sharedAtRult.append(postcss.rule({ selector }).append(marginL, marginR));
  }
}

/** 居中最外层选择器，用 margin 居中，有 border */
function appendMarginCentreRootClassWithBorder(postcss, selector, disableDesktop, disableLandscape, {
  desktopViewAtRule,
  landScapeViewAtRule,
  sharedAtRult,
  desktopWidth,
  landscapeWidth,
  borderColor,
}) {
  if (disableDesktop && !disableLandscape) {
    // 仅移动端横屏
    landScapeViewAtRule.append(postcss.rule({ selector }).append(maxWidth(landscapeWidth), marginL, marginR, contentBox, borderL(borderColor), borderR(borderColor), minFullHeight, autoHeight));
  } else if (disableLandscape && !disableDesktop) {
    // 仅桌面
    desktopViewAtRule.append(postcss.rule({ selector }).append(maxWidth(desktopWidth), marginL, marginR, contentBox, borderL(borderColor), borderR(borderColor), minFullHeight, autoHeight));
  } else if (!disableDesktop && !disableLandscape) {
    // 桌面和移动端横屏
    desktopViewAtRule.append(postcss.rule({ selector }).append(maxWidth(desktopWidth)));
    landScapeViewAtRule.append(postcss.rule({ selector }).append(maxWidth(landscapeWidth)));
    sharedAtRult.append(postcss.rule({ selector }).append(marginL, marginR, contentBox, borderL(borderColor), borderR(borderColor), minFullHeight, autoHeight));
  }
}

function appendCentreRoot(postcss, selector, disableDesktop, disableLandscape, border, {
  rule,
  desktopViewAtRule,
  landScapeViewAtRule,
  sharedAtRult,
  desktopWidth,
  landscapeWidth,
  maxDisplayWidth,
}) {
  const hadBorder = !!border;
  const c = typeof border === "string" ? border : "#eee";
  const limitedWidth = maxDisplayWidth != null;
  if (limitedWidth) {
    if (hadBorder) rule.append(b(maxWidth(maxDisplayWidth)), b(marginL), b(marginR));
    else rule.append(b(maxWidth(maxDisplayWidth)), b(marginL), b(marginR), b(borderL(c)), b(borderR(c)), b(minFullHeight), b(autoHeight), b(contentBox));
    function b(obj) {
      return { ...obj, book: 1, };
    }
  }
  if (hadBorder) {
    appendMarginCentreRootClassWithBorder(postcss, selector, disableDesktop, disableLandscape, {
      desktopViewAtRule,
      landScapeViewAtRule,
      sharedAtRult,
      desktopWidth,
      landscapeWidth,
      borderColor: c,
    });
  } else {
    appendMarginCentreRootClassNoBorder(postcss, selector, disableDesktop, disableLandscape, {
      desktopViewAtRule,
      landScapeViewAtRule,
      sharedAtRult,
      desktopWidth,
      landscapeWidth,
    });
  }
}

module.exports = {
  appendMarginCentreRootClassWithBorder,
  appendMediaRadioPxOrReplaceMobileVwFromPx,
  appendMarginCentreRootClassNoBorder,
  appendDemoContent,
  appendConvertedFixedContainingBlockDecls,
  appendCentreRoot,
  appendCSSVar,
  pxToMaxViewUnit,
  pxToViewUnit,
  vwToMaxViewUnit,
  pxToMediaQueryPx,
  vwToMediaQueryPx,
};
