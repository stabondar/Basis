uniform sampler2D uTexture;
uniform sampler2D uFluid;
uniform vec3 uColor;
uniform vec2 uRes;
uniform vec2 uSize;
uniform vec2 uAspect;
uniform float uBorder;
uniform float uParallax;
uniform float uScroll;

varying vec2 vUv;
varying vec2 screenUv;

#include ../../../../math/getCoverUv.glsl
#include ../../../../math/getAlpha.glsl
#include ../../../../math/fakeBlur.glsl
#include ../../../../math/tint.glsl

void main()
{
    vec2 uv = vUv;
    vec2 coverUv = getCoverUv(uv, uAspect, uSize);

    coverUv -= 0.5;
    coverUv *= 0.9 + (1. - uScroll) * 0.1;
    coverUv += 0.5;

    coverUv.y -= uScroll * 0.1;

    vec4 color = texture2D(uTexture, coverUv);
    float alpha = getAlpha(uSize, uBorder, uv);
    float cursor = texture2D(uFluid, screenUv).r;
    float oldCursor = cursor;
    cursor = smoothstep(0.2, 1.0, cursor);
    cursor = clamp(cursor, 0.0, 1.0);
    cursor = pow(cursor, 2.5); // Adjust cursor sensitivity

    color.a *= alpha;

    float tintAmount = smoothstep(0.0, 1.0, cursor) * 0.1;

    // color.rgb = mix(color.rgb, 1.0 - color.rgb, cursor);
    // vec3 blurColor = 1.0 - fastGaussianBlur(uTexture, coverUv, oldCursor * 5.).rgb;
    vec3 blurColor = fastGaussianBlur(uTexture, coverUv, oldCursor * 5.).rgb;
    blurColor = applyOverlayTint(blurColor, uColor, cursor);
    color.rgb = mix(color.rgb, blurColor, cursor * 2.0);

    float fadeArea = smoothstep(0.0, 0.5, uv.y);
    color.rgb = mix(color.rgb * 0.2, color.rgb, fadeArea);

    float alphaFade = step(uScroll, uv.y);
    color.a *= alphaFade;

    gl_FragColor = color;
}