package com.typesafe.sbt

import com.typesafe.sbtchild.DefaultsShim
import sbt.State

package object ui {

  type RequestHandler = (State, Context, Params) => (State, Params)

  def findHandler(name: String): Option[RequestHandler] = {
    if (DefaultsShim.findHandler.isDefinedAt(name))
      Some(DefaultsShim.findHandler.apply(name))
    else
      None

    // TODO the above implementation is obviously kinda bogus.
    // So how do we implement findHandler? One approach could be that for any task key,
    // we have a way to look up a RequestHandler.
    // Maybe the convention is that we store the "UI handler" inside the scope
    // of the regular task, so "uiHandler in compile" gives you the "ui.RequestHandler" that goes
    // with the compile task?

    // OR, eventually, can we get taskStreams to have a ui context, the same way it has a logger?
    //  taskStreams <<= taskStreams apply { wrapTaskStream(_) }
    // implicit def withUi(t: TaskStream): { def ui: UIContext } = ...
    // That way, you just pull in one "contextual notifier thingy" and you can update both a UI and a console log.
    // (however this doesn't address how we go from input string to task inputs, and task result to output string)
  }
}