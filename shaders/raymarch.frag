//ray marching fragment shader
#include <common>

uniform vec3      iResolution;           // viewport resolution (in pixels)
uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)
uniform int       iFrame;                // shader playback frame
// uniform float     iChannelTime[4];       // channel playback time (in seconds)
// uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
// uniform samplerXX iChannel0..3;          // input channel. XX = 2D/Cube
// uniform vec4      iDate;                 // (year, month, day, time in seconds)
// uniform float     iSampleRate;           // sound sample rate (i.e., 44100)

const float INFINITY = 1.0/0.0;
const int   NUMBER_OF_STEPS = 100;
const float MIN_HIT_DIST    = 0.001;
const float MAX_TRACE_DIST  = 80.0;
const int Iterations = 7;
const float Scale = 10.0;
const float Offset = 0.0;

float sdSphere(in vec3 p, float sphere_radius)
{
    return length(p) - sphere_radius;
}

float sdSphereRepeat(in vec3 p, in vec3 rep_period, float sphere_radius)
{
    p = mod(p+0.5*rep_period,rep_period)-0.5*rep_period;
    return length(p) - sphere_radius;
}

float sdBox(vec3 p, vec3 dimensions)
{
  vec3 q = abs(p) - dimensions;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

//taken from: https://github.com/HackerPoet/PySpace
float sdTetrahedron(vec4 p, float r) 
{
    float md = max(max(-p.x - p.y - p.z, p.x + p.y - p.z),
                   max(-p.x + p.y + p.z, p.x - p.y + p.z));
    return (md - r) / (p.w* sqrt(3.0));
}

float sdTetrahedronRepeat(vec3 p, in vec3 rep_period, float r) 
{
    p = mod(p+0.5*rep_period,rep_period)-0.5*rep_period;
    float md = max(max(-p.x - p.y - p.z, p.x + p.y - p.z),
                   max(-p.x + p.y + p.z, p.x - p.y + p.z));
    return (md - r) / sqrt(3.0);
}

//taken from: http://blog.hvidtfeldts.net/index.php/2011/08/distance-estimated-3d-fractals-iii-folding-space/
void sierpinski_fold(inout vec4 z)
{
    for (int i = 0; i < Iterations; i++) 
    {
       if(z.x+z.y<0.0) z.xy = -z.yx; // fold 1
       if(z.x+z.z<0.0) z.xz = -z.zx; // fold 2
       if(z.y+z.z<0.0) z.zy = -z.yz; // fold 3    
    }
}


// returns distance to nearest object in the world
float sdf(in vec3 pnt)
{
    //float sphere_0 = distance_from_sphere(p, vec3(0.0), 1.0);
    // float sp = sdSphereRepeat(p, vec3(4.0,1.5,8.0), 0.45);
    // float sp2 = sdSphere(p,0.1);
    vec4 p = vec4(pnt,1.0);
    vec4 rep_period = vec4(12.0);
    p = mod(p+0.5*rep_period,rep_period)-0.5*rep_period; //infinite repetition
    float dist = 1e20;
    float s = 4.0;

    // Space folding is weird. These sources helped me understand some:
    // http://blog.hvidtfeldts.net/index.php/2011/08/distance-estimated-3d-fractals-iii-folding-space/
    // https://bellaard.com/articles/Kaleidoscopic%20IFS%20fractals/
    // https://youtu.be/svLzmFuSBhk
    for (int i = 0; i < Iterations; i++) 
    {
        sierpinski_fold(p);
        p *= 2.0;
        p.xyz += vec3(-s);
    }
    dist = min(dist, sdTetrahedron(p,s));
    return dist;
    // float st = sdTetrahedronRepeat(p, vec3(4.0), 0.5);
    // float st2 = sdTetrahedron(p-vec3(0.0,1.0,1.0),0.5);
    // float st3 = sdTetrahedron(p-vec3(1.0,1.0,0.0),0.5);
    // return min(min(st,st2),st3);
    // return min(sp2, fractal);
}

vec3 calc_norm(in vec3 point)
{
    const vec3 SMALL_STEP = vec3(0.001, 0.0, 0.0);

    float gradient_x = sdf(point + SMALL_STEP.xyy) - sdf(point - SMALL_STEP.xyy);
    float gradient_y = sdf(point + SMALL_STEP.yxy) - sdf(point - SMALL_STEP.yxy);
    float gradient_z = sdf(point + SMALL_STEP.yyx) - sdf(point - SMALL_STEP.yyx);
    return normalize(vec3(gradient_x, gradient_y, gradient_z));
}

vec3 ray_march(in vec3 cam_pos, in vec3 ray)
{
    float dist_traveled = 0.0;

    for (int i = 0; i < NUMBER_OF_STEPS; i++)
    {
        vec3 cur_pos = cam_pos + dist_traveled * ray;
        float dist_to_closest = sdf(cur_pos);
        if (dist_to_closest < MIN_HIT_DIST)
        {
            vec3 N = calc_norm(cur_pos);
            // vec3 light_pos = vec3(2.0, -5.0, 3.0);
            // vec3 L = normalize(cur_pos - light_pos); // vector pointing to light
            // float diffuse = max(0.0, dot(N, L)); // lambertian
            // return vec3(1.0,0.0,0.0) * diffuse; // return normalized rgb
            return N * 0.5 + 0.5;
            // return vec3(1.0,0.0,0.0);
        }
        if (dist_traveled > MAX_TRACE_DIST)
        {
            break;
        }
        dist_traveled += dist_to_closest;
    }
    return vec3(0.0); // hit nothing, return black.
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1) then remap to -1 to 1
    vec2 uv = (fragCoord/iResolution.xy)*2.0 - 1.0;
    vec3 cam_pos = vec3((iMouse.x/iResolution.x)*MAX_TRACE_DIST, 0.0, (iMouse.y/iResolution.y)*(MAX_TRACE_DIST-2.0)+2.0); //our "camera" position
    // vec3 cam_pos = vec3(0.0, 0.0, 2.0);
    vec3 ray = normalize(vec3(uv, -1.0));

    vec3 col = ray_march(cam_pos, ray);

    // Output to screen
    fragColor = vec4(col,1.0);
}

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}