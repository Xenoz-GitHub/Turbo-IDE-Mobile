/**
 * Turbo C++ 3.0 Mobile - Programs Library
 * Warm Welcome & Introduction default code and Borland C++ example library.
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

import { DosFile } from '../types/emulator';

export const WELCOME_PROGRAM: DosFile = {
  id: 'welcome',
  hostName: 'welcome.cpp',
  dosName: 'WELCOME.CPP',
  drive: 'D',
  sizeBytes: 960,
  lastModified: Date.now(),
  content: `/*
 * ========================================================
 *   TURBO C++ 3.0 MOBILE - ENCRYPTED CREW
 * ========================================================
 *   Warm Welcome & Introduction!
 *   Original Borland Turbo C++ 3.0 Mobile Environment
 *   Developed by Suarez J. (XenozExe)
 * ========================================================
 */

#include <iostream.h>
#include <conio.h>
#include <dos.h>

void main()
{
    clrscr();
    textcolor(14); // Yellow
    cprintf("=====================================================\\n");
    cprintf("       WELCOME TO TURBO C++ 3.0 MOBILE!              \\n");
    cprintf("             ENCRYPTED CREW                          \\n");
    cprintf("=====================================================\\n\\n");

    textcolor(11); // Light Cyan
    cprintf("Welcome to your mobile Borland Turbo C++ 3.0 IDE.\\n");
    cprintf("Equipped with conio.h, dos.h, and graphics.h\\n");
    cprintf("for authentic mobile C/C++ programming.\\n\\n");

    textcolor(10); // Light Green
    cprintf("QUICK START:\\n");
    cprintf("  * Tap Run on top menu to compile & run\\n");
    cprintf("  * Tap Compile on top menu for syntax check\\n");
    cprintf("  * Tap OUTPUT on keyboard bar to toggle output\\n");
    cprintf("  * Tap Files in top bar to open more examples\\n\\n");

    textcolor(15); // Bright White
    cprintf("Happy Coding with Turbo C++ Mobile!\\n\\n");

    textcolor(14);
    cprintf("Press any key to return to editor...");
    getch();
}
`
};

export const LIBRARY_PROGRAMS: DosFile[] = [
  WELCOME_PROGRAM,
  {
    id: 'salary1',
    hostName: 'salary1.cpp',
    dosName: 'SALARY1.CPP',
    drive: 'D',
    sizeBytes: 384,
    lastModified: Date.now() - 3600000 * 2,
    content: `#include<iostream.h>
#include<conio.h>

void main()
{
  float salary,bonus;
  int grade;
  clrscr();
  cout<<"Enter salary of Employee=";
  cin>>salary;
  cout<<"Enter grade=";
  cin>>grade;

  if(grade>=17)
    bonus = salary * 60.0/100.0;
  else
    bonus = salary * 30.0/100.0;
  salary = salary + bonus;
  cout<<"The Total salary of Employee = "<<salary;

  getch();
}
`
  },
  {
    id: 'first_pr',
    hostName: 'first_pr.cpp',
    dosName: 'FIRST_PR.CPP',
    drive: 'D',
    sizeBytes: 420,
    lastModified: Date.now() - 3600000 * 5,
    content: `#include <conio.h>
#include <graphics.h>
#include <dos.h>

int main()
{
    int gdriver = DETECT, gmode;
    initgraph(&gdriver, &gmode, "C:\\\\TC\\\\BGI");
    
    setcolor(LIGHTCYAN);
    outtextxy(20, 20, "FIRST_PR.CPP Graphics Output Demo");

    for(int i = 20; i < 200; i += 10)
    {
        setlinestyle(0, 0, 1);
        line(i, 50, i, 300);
        delay(30);
    }
    
    outtextxy(20, 320, "Press any key to close graph...");
    getch();
    closegraph();
    return 0;
}
`
  },
  {
    id: 'suarez',
    hostName: 'suarez.cpp',
    dosName: 'SUAREZ.CPP',
    drive: 'D',
    sizeBytes: 460,
    lastModified: Date.now() - 3600000 * 8,
    content: `// SUAREZ.CPP - Developed by Suarez J. (XenozExe)
// Credits: ENCRYPTED CREW
#include<iostream.h>
#include<conio.h>

void main()
{
    clrscr();
    cout << "========================================\\n";
    cout << "  TURBO C++ 3.0 MOBILE EDITION v1.0     \\n";
    cout << "       Credits: ENCRYPTED CREW          \\n";
    cout << "   Developed by Suarez J. (XenozExe)    \\n";
    cout << "========================================\\n\\n";
    cout << "Welcome to Turbo C++ on mobile!\\n";
    cout << "Real 1:1 Borland C++ 3.0 runtime active.\\n\\n";
    cout << "Press any key to return...";
    getch();
}
`
  },
  {
    id: 'hello',
    hostName: 'hello_world.cpp',
    dosName: 'HELLO.CPP',
    drive: 'D',
    sizeBytes: 312,
    lastModified: Date.now() - 3600000 * 24,
    content: `#include<iostream.h>
#include<conio.h>

void main()
{
    clrscr();
    cout << "========================================\\n";
    cout << "  TURBO C++ 3.0 MOBILE EDITION v1.0     \\n";
    cout << "       Credits: ENCRYPTED CREW          \\n";
    cout << "========================================\\n\\n";
    cout << "HELLO WORLD FROM BORLAND C++!\\n";
    cout << "conio.h clrscr() and iostream.h cout ok!\\n\\n";
    cout << "Press any key to return to IDE...";
    getch();
}
`
  },
  {
    id: 'rainbow',
    hostName: 'rainbow.c',
    dosName: 'RAINBOW.C',
    drive: 'D',
    sizeBytes: 520,
    lastModified: Date.now() - 3600000 * 12,
    content: `#include<stdio.h>
#include<conio.h>
#include<graphics.h>
#include<dos.h>

void main()
{
    int gdriver = DETECT, gmode;
    int x, y, i;
    
    initgraph(&gdriver, &gmode, "C:\\\\TC\\\\BGI");
    
    x = getmaxx() / 2;
    y = getmaxy() / 2;
    
    setbkcolor(BLACK);
    cleardevice();
    
    setcolor(LIGHTCYAN);
    outtextxy(x - 140, 25, "TURBO C++ RAINBOW DEMO - ENCRYPTED CREW");
    
    for(i = 30; i < 200; i += 6)
    {
        setcolor((i / 6) % 15 + 1);
        circle(x, y, i);
        delay(35);
    }
    
    setcolor(YELLOW);
    outtextxy(x - 110, getmaxy() - 35, "Press any key to exit graphics mode...");
    getch();
    closegraph();
}
`
  },
  {
    id: 'colours',
    hostName: 'colours.cpp',
    dosName: 'COLOURS.CPP',
    drive: 'D',
    sizeBytes: 460,
    lastModified: Date.now() - 3600000 * 6,
    content: `// WELCOME TO TURBO C++ ON MOBILE NOW RUN YOUR FIRST PROGRAM
// Credits: ENCRYPTED CREW

#include<stdio.h>
#include<conio.h>
#include<dos.h>

void main()
{
    int i;
    clrscr();
    
    for(i = 1; i <= 15; i++)
    {
        textcolor(i);
        textbackground(0);
        cprintf("Color Code %2d: [ENCRYPTED CREW] Turbo C++ Mobile IDE active!\\r\\n", i);
        delay(45);
    }
    
    textcolor(14); // Yellow
    cprintf("\\r\\nconio.h textcolor, textbackground, and gotoxy fully verified!\\r\\n");
    cprintf("Press any key to return to Turbo C++ editor...");
    getch();
}
`
  },
  {
    id: 'sound',
    hostName: 'sound_demo.cpp',
    dosName: 'SOUND.CPP',
    drive: 'D',
    sizeBytes: 580,
    lastModified: Date.now() - 3600000 * 3,
    content: `#include<stdio.h>
#include<conio.h>
#include<dos.h>

void main()
{
    int notes[] = { 261, 293, 329, 349, 392, 440, 493, 523 };
    int i;
    clrscr();
    
    printf("===========================================\\n");
    printf("   PC SPEAKER FREQUENCY SYNTHESIZER DEMO   \\n");
    printf("        Credits: ENCRYPTED CREW            \\n");
    printf("===========================================\\n\\n");
    printf("Playing 8-note musical scale on PC speaker...\\n");
    
    for(i = 0; i < 8; i++)
    {
        printf("Note %d: %d Hz (sound + delay)\\n", i + 1, notes[i]);
        sound(notes[i]);
        delay(220);
        nosound();
        delay(50);
    }
    
    printf("\\nScale playback complete with Web Audio engine!\\n");
    printf("Press any key to exit...");
    getch();
}
`
  },
  {
    id: 'calc',
    hostName: 'calc.cpp',
    dosName: 'CALC.CPP',
    drive: 'D',
    sizeBytes: 890,
    lastModified: Date.now() - 3600000 * 1,
    content: `#include<iostream.h>
#include<conio.h>

void main()
{
    float a, b, res;
    int choice;
    
    clrscr();
    cout << "========================================\\n";
    cout << "     TURBO C++ INTERACTIVE CALCULATOR   \\n";
    cout << "========================================\\n\\n";
    
    cout << "Enter first number: ";
    cin >> a;
    cout << "Enter second number: ";
    cin >> b;
    
    cout << "\\nOperations:\\n";
    cout << "  1. Addition (+)\\n";
    cout << "  2. Subtraction (-)\\n";
    cout << "  3. Multiplication (*)\\n";
    cout << "  4. Division (/)\\n";
    cout << "Enter your choice (1-4): ";
    cin >> choice;
    
    switch(choice)
    {
        case 1:
            res = a + b;
            cout << "\\nResult: " << a << " + " << b << " = " << res << "\\n";
            break;
        case 2:
            res = a - b;
            cout << "\\nResult: " << a << " - " << b << " = " << res << "\\n";
            break;
        case 3:
            res = a * b;
            cout << "\\nResult: " << a << " * " << b << " = " << res << "\\n";
            break;
        case 4:
            if(b == 0)
            {
                cout << "\\n[Error]: Division by zero is undefined!\\n";
            }
            else
            {
                res = a / b;
                cout << "\\nResult: " << a << " / " << b << " = " << res << "\\n";
            }
            break;
        default:
            cout << "\\nInvalid option selected!\\n";
            break;
    }
    
    cout << "\\nPress any key to return...";
    getch();
}
`
  },
  {
    id: 'bubblesort',
    hostName: 'sort.cpp',
    dosName: 'SORT.CPP',
    drive: 'D',
    sizeBytes: 820,
    lastModified: Date.now() - 3600000 * 1,
    content: `#include<iostream.h>
#include<conio.h>

void main()
{
    int arr[10];
    int n, i, j, temp;
    
    clrscr();
    cout << "--- BUBBLE SORT ALGORITHM ---\\n\\n";
    cout << "How many numbers (max 10)? ";
    cin >> n;
    
    cout << "Enter " << n << " numbers:\\n";
    for(i = 0; i < n; i++)
    {
        cout << "arr[" << i << "] = ";
        cin >> arr[i];
    }
    
    // Bubble sort algorithm
    for(i = 0; i < n - 1; i++)
    {
        for(j = 0; j < n - i - 1; j++)
        {
            if(arr[j] > arr[j + 1])
            {
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    
    cout << "\\nSorted array in ascending order:\\n";
    for(i = 0; i < n; i++)
    {
        cout << arr[i] << " ";
    }
    cout << "\\n\\nDone! Press any key...";
    getch();
}
`
  }
];

// Default initial open files: only the introduction and warm welcome code!
export const SAMPLE_PROGRAMS: DosFile[] = [WELCOME_PROGRAM];

// Virtual C:\ system files (Borland Turbo C++ 3.0 binaries, headers, and BGI drivers)
export const VIRTUAL_SYSTEM_FILES: DosFile[] = [
  {
    id: 'tc_exe',
    hostName: 'tc.exe',
    dosName: 'TC.EXE',
    drive: 'C',
    sizeBytes: 298450,
    lastModified: 686102400000,
    content: '// Borland Turbo C++ 3.0 Binary Executable'
  },
  {
    id: 'tcconfig_tc',
    hostName: 'tcconfig.tc',
    dosName: 'TCCONFIG.TC',
    drive: 'C',
    sizeBytes: 1024,
    lastModified: 686102400000,
    content: 'C:\\TC\\INCLUDE;C:\\TC\\LIB;C:\\TC\\BGI'
  },
  {
    id: 'conio_h',
    hostName: 'conio.h',
    dosName: 'CONIO.H',
    drive: 'C',
    sizeBytes: 4096,
    lastModified: 686102400000,
    content: '/* Borland conio.h header: clrscr, getch, textcolor, textbackground, gotoxy, cprintf */'
  },
  {
    id: 'graphics_h',
    hostName: 'graphics.h',
    dosName: 'GRAPHICS.H',
    drive: 'C',
    sizeBytes: 8192,
    lastModified: 686102400000,
    content: '/* Borland graphics.h header: initgraph, circle, line, rectangle, outtextxy, closegraph */'
  },
  {
    id: 'dos_h',
    hostName: 'dos.h',
    dosName: 'DOS.H',
    drive: 'C',
    sizeBytes: 6144,
    lastModified: 686102400000,
    content: '/* Borland dos.h header: sound, nosound, delay */'
  },
  {
    id: 'iostream_h',
    hostName: 'iostream.h',
    dosName: 'IOSTREAM.H',
    drive: 'C',
    sizeBytes: 12288,
    lastModified: 686102400000,
    content: '/* Borland iostream.h header: cout, cin, endl */'
  },
  {
    id: 'egavga_bgi',
    hostName: 'egavga.bgi',
    dosName: 'EGAVGA.BGI',
    drive: 'C',
    sizeBytes: 5472,
    lastModified: 686102400000,
    content: '// Borland Graphics Interface EGA/VGA Driver 640x480'
  }
];
