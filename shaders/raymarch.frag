//ray marching fragment shader

uniform vec3      iResolution;           // viewport resolution (in pixels)
//uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)
uniform int       iFrame;                // shader playback frame
uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
uniform vec3      keyboard;
uniform float     morphing;
uniform int       user; 

const float INFINITY = 1e20;
const int   NUMBER_OF_STEPS = 100;
const float MIN_HIT_DIST    = 0.001;
const float MAX_TRACE_DIST  = 40.0;
const int ITERATIONS = 5; // how many times to fold
const float SCALE = 1.0; // size of sdf shapes
const float OFFSET = 1.0; // offset for any sdf that uses distance shifting
const vec4 REPETITION_PERIOD = vec4(16.0,5.0,8.0,12.0); // how often to repeat--higher numbers repeat less often
float box_position_x = 0.;
float sphere_position_x = 0.;
bool dir = true;
// returns distance to nearest object in the world
float sdf(in vec3 pnt)
{   
    //Prashant
    if(user == 6){
        float mengerBox = sdMengerBox(pnt);
        vec3 pnt = tri_curve(pnt);
        float mengerBoxFold = sdMengerBox(pnt*0.004);
        return mix(mengerBox,mengerBoxFold,morphing);
    }
    if(user == 1){
        if(dir)
            sphere_position_x = pnt.x + 1.5 - iTime/5.;
        else
            sphere_position_x = pnt.x - 0.1 + iTime/5.;
            
        float sphere = sdSphere(
            vec3(sphere_position_x,pnt.y,pnt.z),
            0.4
        );
        box_position_x = pnt.x;
        float box = sdBox(
            vec3(box_position_x,pnt.y,pnt.z),
            vec3(0.3)
        );

        if(dir)
            dir = ray_march_sphere(vec3(sphere_position_x-0.4-0.3,pnt.y,pnt.z),box_position_x);

        return min(sphere,box);
    }

    //Michael
    else if(user == 2){
        vec4 p = vec4(pnt,1.0);
        //p = opRepeat(p, REPETITION_PERIOD); //infinite repetition
        sierpinski_fold(p, ITERATIONS, OFFSET);
        return min(INFINITY, sdTetrahedron(p,SCALE));
    }

    //Siddhant
    if(user == 3){
        float sphere = sdSphere(pnt,0.4);
        float box = sdBox(pnt,vec3(0.3));
        return smin(sphere,box,0.3);
    }

    //Mozhdeh
    if(user == 4){
        float sphere = sdSphere(pnt,0.4);
        float box = sdBox(pnt,vec3(0.3));
        return max(-sphere,box);
    }

    //Kaushik
    if(user == 5){
        float sphere = sdSphere(pnt,0.4);
        float box = sdBox(pnt,vec3(0.3));
        return max(sphere,-box);
    }
}

//calculate the normal of a 3d surface
vec3 calc_norm(in vec3 point)
{
    const vec3 SMALL_STEP = vec3(0.001, 0.0, 0.0);

    float gradient_x = sdf(point + SMALL_STEP.xyy) - sdf(point - SMALL_STEP.xyy);
    float gradient_y = sdf(point + SMALL_STEP.yxy) - sdf(point - SMALL_STEP.yxy);
    float gradient_z = sdf(point + SMALL_STEP.yyx) - sdf(point - SMALL_STEP.yyx);
    return normalize(vec3(gradient_x, gradient_y, gradient_z));
}

vec3 lighting(in vec3 cur_pos)
{
    vec3 N = calc_norm(cur_pos);

    //diffuse lighting
    // vec3 light_pos = vec3(2.0, -5.0, 3.0);
    // vec3 L = normalize(pos - light_pos); // vector pointing to light
    // float diffuse = max(0.0, dot(N, L)); // lambertian
    // return vec3(1.0,0.0,0.0) * diffuse; // return normalized rgb

    //since normal will be -1 to 1, "normalize" returned color to 0 to 1
    return N * 0.5 + 0.5; 
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
            return lighting(cur_pos);
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
    vec2 mouse = (iMouse.xy/iResolution.xy)*10.0;
    vec3 cam_pos = vec3(keyboard.x, keyboard.y, keyboard.z); //our "camera" position
    // vec3 cam_pos = vec3(0.0, 0.0, 2.0);
    vec3 ray = normalize(vec3(uv, -1.0));
    ray = rotate(ray, vec3(0.0,1.0, 0.0), mouse.x);
    ray = rotate(ray, vec3(1.0,0.0, 0.0), mouse.y);

    vec3 col = ray_march(cam_pos, ray);

    // Output to screen
    fragColor = vec4(col,1.0);
}

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}