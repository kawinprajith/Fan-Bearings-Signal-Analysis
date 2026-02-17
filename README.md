# Fan-Bearings-Signal-Analysis

Envelope spectrum analysis involves band-pass filtering the signal around resonance 
frequencies, rectifying the filtered signal to obtain the envelope, and performing FFT on 
the envelope signal. Due to limited sampling rates of mobile accelerometers, envelope 
analysis is implemented only for offline dataset mode.


The Time Domain Vibration signal dataset as input is analysed 
<img width="1002" height="499" alt="image" src="https://github.com/user-attachments/assets/49160022-5ce8-48dd-a174-3183eef06ed6" />


The FFT spectrum of the Vibration signal
<img width="960" height="263" alt="image" src="https://github.com/user-attachments/assets/21f6326e-101e-495f-8ab3-3e6aec438d2d" />


The IMPORTANT spectrum, the Envelop spectrum showing bearing Normal and Faulty frequency Output
<img width="994" height="307" alt="image" src="https://github.com/user-attachments/assets/714f361c-4732-4fb3-9e2d-c2a360d029e9" />

At begining of analsis of the spectrum, don't consider the few frequency values.
The First Normal Envelope spectrum shows the peak value of 5 and the Faulty Envelope spectrum shows the peak value of 16.
This concludes that the faulty dataset has a faulty bearing.
