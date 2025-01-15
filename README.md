# IsoMix

Made during the Livepeer ComfyStream program. 

[Workflow](https://github.com/emmajane1313/iso_mix/blob/main/isomix_workflow.json)

[Video walkthrough](https://tape.xyz/watch/0x84ec-0x0208)

## Description
A dual-prompt segmentation workflow for real-time video manipulation. IsoMix transforms natural language input into precise region masks, enabling users to isolate and modify specific areas of their stream through semantic targeting. The system processes two distinct prompts: one for intelligent region selection, and another for generating contextual replacements within the masked areas. 

I probably burned through about 30 different workflow setups during the program - way more if you count all the custom node tweaks and dead-end NVIDIA tools I tried. Started with fashion swap segmentation but hit a wall when the compute demands tanked the FPS to zero, even after swapping Flux for SD 1.5.

The FPS still sucks, honestly, and fixing that's next on my list. But the current dual-prompt setup ended up being weirdly engaging - users playing with both segmentation and mask inference keeps things interesting enough that the low FPS isn't a dealbreaker. It's more dynamic than my original plan but keeps the core idea.

Next up: getting the FPS to something reasonable and adding some audio reactive stuff that could be pretty wild with this setup.
 
## Reproducing the Workflow
1. Follow all steps for Comfystream setup [here](https://livepeer.notion.site/ComfyStream-Dev-Environment-Setup-15d0a3485687802e9528d26050142d82) by @ryanontheinside

2. Once you have your environment setup, replace the ComfyStream folder for the ComfyStream folder in this repo. Some customisations were added so that user input for changing prompts is accepted on the interface. Make sure to install dependencies for the new ComfyStream in  `ComfyStream/ui` and to run your server from this ComfyStream folder: 
```bash
npm i --legacy-peer-deps
``` 

3. You will need to add a variety of Custom Nodes to `ComfyUi/custom_nodes`. I made some small changes to test faster model loading and streamline the workflow a little, so I've forked the original nodes. Make sure all pip installs are executed within the comfystream conda environment.

- Florence2: 
``` 
git clone https://github.com/emmajane1313/ComfyUI-Florence2.git  
cd ComfyUI-Florence2 
pip install -r requirements.txt 
```

- SAM2: 
```
git clone https://github.com/emmajane1313/ComfyUI-segment-anything-2.git
cd ComfyUI-segment-anything-2
pip install -r requirements.txt
```

3. Now add the models used in the workflow to `ComfyUi/models`. 

- Florence2: 
    - Download this [model](https://huggingface.co/microsoft/Florence-2-base) to `ComfyUi/models/LLM/`

- Sam2: 
    - Download `sam2_hiera_small.safetensors` from [here](https://huggingface.co/Kijai/sam2-safetensors/tree/main) to `ComfyUi/models/sam2/`

- SD1.5: 
    - I used [this model](https://civitai.green/models/85953/pixelstyleckpt?modelVersionId=91384) in the workflow. You can use any SD1.5 model but make sure that it is saved in `ComfyUi/models/checkpoints/` and that you update the model path in Node 5 of the workflow under inputs "ckpt_name" at `ComfyStream/workflows/isomix_workflow.json` 


