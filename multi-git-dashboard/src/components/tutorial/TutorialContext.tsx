import { tutorialContents } from '@/lib/utils';
import { nprogress } from '@mantine/nprogress';
import { ReactNode, createContext, useContext, useState } from 'react';

interface TutorialContextValue {
  curTutorialStage: number;
  nextTutorialStage: () => void;
  previousTutorialStage: () => void;
  startTutorial: () => void;
  finishTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextValue>(
  {} as TutorialContextValue
);

export const useTutorialContext = () => useContext(TutorialContext);

export const TutorialContextProvider = ({
  children,
  init,
}: {
  children: ReactNode;
  init: number;
}) => {
  const [curTutorialStage, setCurTutorialStage] = useState(init);

  const nextTutorialStage = () => {
    setCurTutorialStage(stage => stage + 1);
    if (curTutorialStage === tutorialContents.length) {
      nprogress.complete();
    } else {
      nprogress.set((curTutorialStage / (tutorialContents.length - 1)) * 100);
    }
  };
  const startTutorial = () => {
    nprogress.reset();
    setCurTutorialStage(0);
  };
  const finishTutorial = () => {
    nprogress.complete();
    setCurTutorialStage(-1);
  };

  const previousTutorialStage = () => {
    setCurTutorialStage(stage => {
      if (stage > 0) {
        const newStage = stage - 1;
        nprogress.set((newStage / (tutorialContents.length - 1)) * 100);
        return newStage;
      }
      return stage;
    });
  };

  return (
    <TutorialContext.Provider
      value={{
        curTutorialStage,
        nextTutorialStage,
        previousTutorialStage,
        startTutorial,
        finishTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};
