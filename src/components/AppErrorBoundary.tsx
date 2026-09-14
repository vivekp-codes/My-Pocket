import { Component, type ReactNode } from "react";
import ErrorPage from "./ErrorPage";

interface State {
  hasError: boolean;
}

interface Props {
  children: ReactNode;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Surface unexpected render errors so they aren't silently swallowed.
    console.error("My Pocket render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage kind="crash" />;
    }
    return this.props.children;
  }
}