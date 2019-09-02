import { Optional } from "java8script";

export type AudioProcessingCallback = (event: AudioProcessingEvent) => void;

export class AudioStack {

    private static BUFFER_SIZE = 16384;
    private static STACK_BUFFER = 2;

    private context: AudioContext;

    //reading audio from Mic stuff
    private micSource: MediaStreamAudioSourceNode;
    private micReadingProcessor: ScriptProcessorNode;


    //playing audio stuff
    private bufferStack: AudioBuffer[];

    private toSpeakers?: AudioBufferSourceNode;
    private currentlyPlayingAudio: boolean;
    private reachedMinimumStackSize: boolean;
    private isAudioStackLoopStarted: boolean;

    constructor(micStream: MediaStream) {
        this.bufferStack = [];
        this.isAudioStackLoopStarted = false;
        this.currentlyPlayingAudio = false;
        this.reachedMinimumStackSize = false;

        //prepare the audio Context
        this.context = new AudioContext();
        //create a streaming media source from the mic
        this.micSource = this.context.createMediaStreamSource(micStream);
        //createa a rocessor node and connect the mic source to it
        this.micReadingProcessor = this.context.createScriptProcessor(AudioStack.BUFFER_SIZE, 1, 1);
        this.micSource.connect(this.micReadingProcessor);

        //finally connect the mic reading processor to the speakers?
        this.micReadingProcessor.connect(this.context.destination);
    }

    public start(): void {
        this.isAudioStackLoopStarted = true;
        setInterval(this.singleLoop, 0);
    }

    public isStarted(): boolean {
        return this.isAudioStackLoopStarted;
    }

    public stop(): void {
        clearInterval();
        //this.isAudioStackLoopStarted = false;
    }

    public attachMicReadingProcessor(callback: AudioProcessingCallback): void {
        this.micReadingProcessor.onaudioprocess = callback;
    }

    public clearMicReadingProcessor(): void {
        this.attachMicReadingProcessor(() => { });
    }

    public add(audioSnip: ArrayBuffer) {
        const buffer = this.context.createBuffer(1, AudioStack.BUFFER_SIZE, this.context.sampleRate);
        buffer.copyToChannel(new Float32Array(audioSnip), 0);
        this.bufferStack.push(buffer); //pushes onto the END of the array, shift will remove from the front
    }

    private singleLoop = (): void => {
        //console.log("loop");
        //keep looping until stop() is called
        if (this.isAudioStackLoopStarted) {
            //reset the stack buildup if hits the bottom;
            if (this.bufferStack.length === 0 && this.reachedMinimumStackSize) {
                this.reachedMinimumStackSize = false;
            }
            //wait until the min size is reached, then play all items
            if (this.bufferStack.length > AudioStack.STACK_BUFFER || this.reachedMinimumStackSize) {
                //console.log("output starting")
                this.reachedMinimumStackSize = true;
                //play sound if there isnt a sound in progress
                //console.log("currentlyPlaying"+this.currentlyPlayingAudio);
                if (!this.currentlyPlayingAudio) {
                    Optional.ofNullable(this.bufferStack.shift())
                        .ifPresent(audioBuffer => {
                            //console.log("staring next bit")
                            //console.log(audioBuffer);
                            this.toSpeakers = this.context.createBufferSource();
                            this.toSpeakers.buffer = audioBuffer;
                            this.toSpeakers.connect(this.context.destination);
                            this.toSpeakers.onended = () => { 
                                //console.log("onEnded");
                                this.currentlyPlayingAudio = false; 
                            };
                            this.currentlyPlayingAudio = true;
                            this.toSpeakers.start(0);
                        })

                }
            }
        }
    }
}

// the run loop should start playing audio after its reached the min stack size, then it should keep playing until it hits 0, then build up past the stack size again