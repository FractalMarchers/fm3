//ray marching fragment shader

uniform vec3      iResolution;           // viewport resolution (in pixels)
//uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)
uniform int       iFrame;                // shader playback frame
uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
uniform vec3      keyboard;
uniform float     morphing;
uniform int       user;
uniform vec3      lightDir; 
uniform bool      lightingBoolean;

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
    // vec4 p = vec4(pnt,1.0);
    // //p = opRepeat(p, REPETITION_PERIOD); //infinite repetition
    // sierpinski_fold(p, ITERATIONS, OFFSET);
    // return min(INFINITY, sdTetrahedron(p,SCALE));
    float box = sdBox(pnt,vec3(0.3));
    float res = INFINITY;
    // vec3 vert = opFiniteRepeat(pnt, 0.2, vec3(0.0, 2.0, 0.0));
    float d = -5.0;
    float w = 0.3;

    //F
    res = smin(res, sdBox(pnt-vec3(-2.0+d, 0.0, d), vec3(0.2, 1.0, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(-1.5+d, 1.0, d), vec3(0.5, 0.2, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(-1.5+d, 0.3, d), vec3(0.3, 0.2, 0.2)), w);
    //R
    res = min(res, sdBox(pnt-vec3(-0.6+d, 0.0, d), vec3(0.2, 1.0, 0.2)));
    vec3 diag = rotate(pnt-vec3(0.0+d, -0.3, d),vec3(0.0,0.0,1.0),-0.91);
    res = smin(res, sdBox(diag, vec3(0.4, 0.2, 0.2)), w);
    res = smin(res, sdTorus(rotate(pnt-vec3(-0.25+d, 0.6, d),vec3(1.0,0.0,0.0),-1.5708), vec2(0.4, 0.1)),w);
    //A
    res = smin(res, sdBox(rotate(pnt-vec3(1.8+d, 0.1, d), vec3(0.0,0.0,1.0),-1.22), vec3(1.0, 0.2, 0.2)), w);
    res = smin(res, sdBox(rotate(pnt-vec3(1.05+d, 0.1, d), vec3(0.0,0.0,1.0),1.22), vec3(1.0, 0.2, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(1.3+d, -0.3, d), vec3(0.4, 0.2, 0.2)), w);
    //C
    res = smin(res, sdBox(pnt-vec3(2.6+d, 0.0, d), vec3(0.2, 1.0, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(3.1+d, 1.0, d), vec3(0.5, 0.2, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(3.1+d, -1.0, d), vec3(0.5, 0.2, 0.2)), w);
    //T
    res = smin(res, sdBox(pnt-vec3(4.6+d, 0.0, d), vec3(0.2, 1.0, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(4.6+d, 1.0, d), vec3(0.8, 0.2, 0.2)), w);
    //A
    vec4 tp = vec4(rotate(pnt-vec3(6.0+d, 0.0, d), vec3(0.0,0.5,0.0),-3.14*cos(iTime)), 1.0);
    res = smin(res, sdTetrahedron(tp, 0.8), 0.5);
    //L
    res = smin(res, sdBox(pnt-vec3(7.5+d, 0.0, d), vec3(0.2, 1.0, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(8.2+d, -0.8, d), vec3(0.5, 0.2, 0.2)), w);

    //M
    res = smin(res, sdBox(pnt-vec3(-2.0+d, -3.0, d), vec3(0.2, 1.0, 0.2)), w);
    res = smin(res, sdBox(rotate(pnt-vec3(-1.6+d, -2.8, d), vec3(0.0,0.0,1.0),-1.22), vec3(0.8, 0.2, 0.2)), w);
    res = smin(res, sdBox(rotate(pnt-vec3(-0.95+d, -2.8, d), vec3(0.0,0.0,1.0),1.22), vec3(0.8, 0.2, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(-0.5+d, -3.0, d), vec3(0.2, 1.0, 0.2)), w);
    //A
    res = smin(res, sdBox(rotate(pnt-vec3(1.0+d, -2.9, d), vec3(0.0,0.0,1.0),-1.22), vec3(1.0, 0.2, 0.2)), w);
    res = smin(res, sdBox(rotate(pnt-vec3(0.25+d, -2.9, d), vec3(0.0,0.0,1.0),1.22), vec3(1.0, 0.2, 0.2)), w);
    res = smin(res, sdBox(rotate(pnt-vec3(0.7+d, -3.3, d), vec3(1.0,0.0,0.0),-3.14*sin(iTime)), vec3(0.4, 0.2, 0.2)), w);
    //R
    res = min(res, sdBox(pnt-vec3(1.9+d, -3.0, d), vec3(0.2, 1.0, 0.2)));
    res = smin(res, sdBox(rotate(pnt-vec3(2.5+d, -3.3, d),vec3(0.0,0.0,1.0),-0.91), vec3(0.4, 0.2, 0.2)), w);
    res = smin(res, sdTorus(rotate(pnt-vec3(2.25+d, -2.4, d),vec3(1.0,0.0,0.0),-1.5708), vec2(0.4, 0.1)),w);
    //C
    res = smin(res, sdBox(pnt-vec3(3.1+d, -3.0, d), vec3(0.2, 1.0, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(3.6+d, -2.0, d), vec3(0.5, 0.2, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(3.6+d, -4.0, d), vec3(0.5, 0.2, 0.2)), w);
    // H
    res = smin(res, sdBox(pnt-vec3(4.6+d, -3.0, d), vec3(0.2, 1.0, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(5.1+d, -3.0, d), vec3(0.5, 0.2, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(5.6+d, -3.0, d), vec3(0.2, 1.0, 0.2)), w);
    //E
    res = smin(res, sdBox(pnt-vec3(6.5+d, -3.0, d), vec3(0.2, 1.0, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(6.8+d, -2.0, d), vec3(0.5, 0.2, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(6.8+d, -3.0, d), vec3(0.5, 0.2, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(6.8+d, -4.0, d), vec3(0.5, 0.2, 0.2)), w);
    //R
    res = min(res, sdBox(pnt-vec3(7.6+d, -3.0, d), vec3(0.2, 1.0, 0.2)));
    res = smin(res, sdBox(rotate(pnt-vec3(8.2+d, -3.3, d),vec3(0.0,0.0,1.0),-0.91), vec3(0.4, 0.2, 0.2)), w);
    res = smin(res, sdTorus(rotate(pnt-vec3(7.95+d, -2.4, d),vec3(1.0,0.0,0.0),-1.5708*tan(iTime)), vec2(0.4, 0.1)),w);
    //S
    res = smin(res, sdBox(pnt-vec3(9.5+d, -2.0, d), vec3(0.5, 0.2, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(9.5+d, -3.0, d), vec3(0.5, 0.2, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(9.5+d, -4.0, d), vec3(0.5, 0.2, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(9.0+d, -2.5, d), vec3(0.2, 0.5, 0.2)), w);
    res = smin(res, sdBox(pnt-vec3(10.0+d, -3.5, d), vec3(0.2, 0.5, 0.2)), w);

    return res;
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

vec3 lighting(in vec3 cur_pos,vec3 ray)
{
    if(lightingBoolean){
        float ambient = .1;
        float diffuse_c = 0.6;
        float specular_c = 0.8;
        float specular_k = 20.;

        vec4 p = vec4(cur_pos,1.0);
        //p = opRepeat(p, REPETITION_PERIOD);
        //replacing cur_pos with p.xyz to have similar lighting for all objects
        vec3 N = calc_norm(p.xyz);
        vec3 eyeDir = normalize(-ray);

        //diffuse lighting
        vec3 light_pos = vec3(lightDir.x,-1.*lightDir.y,lightDir.z);
        vec3 L = normalize(p.xyz - light_pos); // vector pointing to light
        float diffuse = max(0.0, dot(N, L)); // lambertian

        //specular lighting
        vec3 R = 2.0 * dot(N, L) * N - L;
        float specular = pow( max(dot(R, eyeDir), 0.0), specular_k) ;

        //compute final color for each obj
        vec3 color = vec3(0.0);
        if( abs(p.y + 1.0) < MIN_HIT_DIST ) //plane color
        {
            color = vec3(0.5,0.4,0.5) * ambient; 
        }
        else //sphere color
        {
            color = vec3(1.0,1.0,1.0) * ambient;
            color += vec3(1.0,1.0,1.0) * diffuse * diffuse_c;
            color += vec3(1.0,1.0,1.0) * specular * specular_c ;
        }
        return color;
    }
    else{
        vec3 N = calc_norm(cur_pos);
        return N * 0.5 + 0.5; 
    }
    
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
            return lighting(cur_pos,ray);
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